import fs from "node:fs";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "./prisma.js";
import { resolveS3Client } from "./storage-presign.js";
const resolveStorageBucket = () => {
    if (process.env.SPACES_BUCKET) {
        return process.env.SPACES_BUCKET;
    }
    return process.env.NODE_ENV !== "production" ? "einstore-local" : null;
};
const parseSpacesPath = (value) => {
    if (!value.startsWith("spaces://"))
        return null;
    const stripped = value.replace("spaces://", "");
    const [bucket, ...rest] = stripped.split("/");
    if (!bucket || !rest.length)
        return null;
    return { bucket, key: rest.join("/") };
};
const resolveRemoteObject = (storagePath, fallbackBucket) => {
    const parsed = parseSpacesPath(storagePath);
    if (parsed)
        return parsed;
    if (!fallbackBucket)
        return null;
    if (storagePath.includes("://"))
        return null;
    const key = storagePath.replace(/^\/+/, "");
    if (!key)
        return null;
    return { bucket: fallbackBucket, key };
};
const extractIconPath = (metadata) => {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
        return null;
    const iconBitmap = metadata.iconBitmap;
    if (!iconBitmap || typeof iconBitmap !== "object" || Array.isArray(iconBitmap))
        return null;
    const record = iconBitmap;
    return typeof record.path === "string" ? record.path : null;
};
const collectRemoteObjects = ({ builds, artifacts, iconPaths, }) => {
    const storageBucket = resolveStorageBucket();
    const remoteObjects = new Map();
    const addRemoteObject = (storagePath) => {
        const resolved = resolveRemoteObject(storagePath, storageBucket);
        if (!resolved)
            return;
        remoteObjects.set(`${resolved.bucket}/${resolved.key}`, resolved);
    };
    builds
        .filter((build) => build.storageKind === "s3")
        .forEach((build) => addRemoteObject(build.storagePath));
    artifacts
        .filter((artifact) => artifact.storageKind === "s3")
        .forEach((artifact) => addRemoteObject(artifact.storagePath));
    iconPaths.forEach((iconPath) => addRemoteObject(iconPath));
    return { remoteObjects, storageBucket };
};
const removeLocalFiles = async (paths) => {
    if (!paths.length)
        return;
    await Promise.all(paths.map((storagePath) => fs.promises.rm(storagePath, { force: true }).catch(() => undefined)));
};
const removeRemoteFiles = async (client, remoteObjects) => {
    if (!remoteObjects.size || !client)
        return;
    await Promise.all(Array.from(remoteObjects.values()).map((item) => client
        .send(new DeleteObjectCommand({
        Bucket: item.bucket,
        Key: item.key,
    }))
        .catch(() => undefined)));
};
export const deleteBuildsWithDependencies = async (buildIds) => {
    if (!buildIds.length)
        return { deletedBuilds: 0 };
    const builds = await prisma.build.findMany({
        where: { id: { in: buildIds } },
        select: { id: true, storageKind: true, storagePath: true },
    });
    if (!builds.length)
        return { deletedBuilds: 0 };
    const artifacts = await prisma.complianceArtifact.findMany({
        where: { buildId: { in: buildIds } },
        select: { storageKind: true, storagePath: true },
    });
    const targets = await prisma.target.findMany({
        where: { buildId: { in: buildIds } },
        select: { id: true, metadata: true },
    });
    const targetIds = targets.map((target) => target.id);
    const iconPaths = targets
        .map((target) => extractIconPath(target.metadata))
        .filter((iconPath) => Boolean(iconPath));
    const { remoteObjects } = collectRemoteObjects({
        builds,
        artifacts,
        iconPaths,
    });
    const s3Client = remoteObjects.size ? resolveS3Client() : null;
    if (remoteObjects.size && !s3Client) {
        const error = new Error("storage_not_configured");
        error.code = "storage_not_configured";
        throw error;
    }
    await prisma.$transaction([
        prisma.comment.deleteMany({
            where: { parentId: { in: buildIds }, category: "build" },
        }),
        prisma.buildEvent.deleteMany({
            where: { buildId: { in: buildIds } },
        }),
        prisma.trackingEvent.deleteMany({
            where: { buildId: { in: buildIds } },
        }),
        prisma.buildTag.deleteMany({
            where: { buildId: { in: buildIds } },
        }),
        prisma.capability.deleteMany({
            where: { targetId: { in: targetIds } },
        }),
        prisma.target.deleteMany({
            where: { buildId: { in: buildIds } },
        }),
        prisma.variant.deleteMany({
            where: { buildId: { in: buildIds } },
        }),
        prisma.module.deleteMany({
            where: { buildId: { in: buildIds } },
        }),
        prisma.complianceArtifact.deleteMany({
            where: { buildId: { in: buildIds } },
        }),
        prisma.signingIdentity.deleteMany({
            where: { buildId: { in: buildIds } },
        }),
        prisma.build.deleteMany({
            where: { id: { in: buildIds } },
        }),
    ]);
    await removeRemoteFiles(s3Client, remoteObjects);
    await removeLocalFiles([
        ...builds.filter((build) => build.storageKind === "local").map((build) => build.storagePath),
        ...artifacts
            .filter((artifact) => artifact.storageKind === "local")
            .map((artifact) => artifact.storagePath),
    ]);
    return { deletedBuilds: builds.length };
};

import fs from "node:fs";
import path from "node:path";
import { PlatformKind, TargetRole } from "@prisma/client";
import { prisma } from "../prisma.js";
const sanitizePathSegment = (value) => value.replace(/[^a-zA-Z0-9._-]+/g, "_");
const writeIconBitmap = (slug, iconBase64, width, height, bytes, sourcePath) => {
    const buffer = Buffer.from(iconBase64, "base64");
    const outputDir = path.resolve(process.cwd(), "storage", "ingest", sanitizePathSegment(slug));
    fs.mkdirSync(outputDir, { recursive: true });
    const filename = `icon-${width}x${height}.png`;
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, buffer);
    return {
        sourcePath: sourcePath ?? filename,
        path: filePath,
        width,
        height,
        sizeBytes: bytes ?? buffer.length,
    };
};
const deriveAppName = (identifier) => {
    const segment = identifier.split(".").filter(Boolean).pop() || identifier;
    if (!segment)
        return identifier;
    if (segment.toLowerCase().startsWith("gp") && segment.length > 2) {
        return `GP${segment.slice(2, 3).toUpperCase()}${segment.slice(3)}`;
    }
    return `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`;
};
export async function ingestIosFromFunction(payload, storageKey, sizeBytes, teamId, createdByUserId, options) {
    const billingGuard = options?.billingGuard;
    const mainTarget = payload.targets.find((target) => target.role === "app") ?? payload.targets[0];
    if (!mainTarget) {
        throw new Error("Missing targets from ingest function");
    }
    if (billingGuard?.assertCanCreateApp) {
        await billingGuard.assertCanCreateApp({
            teamId,
            userId: createdByUserId,
            identifier: payload.identifier,
        });
    }
    const appRecord = await prisma.app.upsert({
        where: { teamId_identifier: { teamId, identifier: payload.identifier } },
        update: { name: payload.appName },
        create: { identifier: payload.identifier, name: payload.appName, teamId },
    });
    if (billingGuard?.assertCanCreateBuild) {
        await billingGuard.assertCanCreateBuild({ teamId, appId: appRecord.id });
    }
    const versionRecord = await prisma.version.upsert({
        where: {
            appId_version: {
                appId: appRecord.id,
                version: payload.version,
            },
        },
        update: {},
        create: { appId: appRecord.id, version: payload.version },
    });
    const build = await prisma.build.create({
        data: {
            versionId: versionRecord.id,
            buildNumber: payload.buildNumber,
            displayName: payload.appName,
            storageKind: "s3",
            storagePath: storageKey,
            sizeBytes,
            createdByUserId,
        },
    });
    let mainIconBitmap;
    if (payload.iconBase64 && payload.iconWidth && payload.iconHeight) {
        mainIconBitmap = writeIconBitmap(payload.identifier, payload.iconBase64, payload.iconWidth, payload.iconHeight, payload.iconBytes, payload.iconSourcePath);
    }
    for (const target of payload.targets) {
        await prisma.target.create({
            data: {
                buildId: build.id,
                platform: target.platform,
                role: target.role,
                bundleId: target.bundleId,
                metadata: {
                    name: target.name,
                    version: target.version,
                    build: target.build,
                    supportedDevices: target.supportedDevices,
                    orientations: target.orientations,
                    minOsVersion: target.minOsVersion,
                    iconBitmap: target.bundleId === mainTarget.bundleId ? mainIconBitmap : undefined,
                    info: target.info,
                },
            },
        });
    }
    await prisma.complianceArtifact.create({
        data: {
            buildId: build.id,
            kind: "manifest",
            storageKind: "s3",
            storagePath: storageKey,
            metadata: {
                appName: payload.appName,
                identifier: payload.identifier,
                version: payload.version,
                buildNumber: payload.buildNumber,
                targets: payload.targets,
            },
        },
    });
    await prisma.complianceArtifact.create({
        data: {
            buildId: build.id,
            kind: "entitlements",
            storageKind: "s3",
            storagePath: storageKey,
            metadata: {
                distribution: payload.entitlements?.distribution,
                entitlements: payload.entitlements?.entitlements,
                entitlementsSource: payload.entitlements?.entitlementsSource,
                provisioningProfile: payload.entitlements?.provisioningProfile,
                provisioningProfileSource: payload.entitlements?.provisioningProfileSource,
            },
        },
    });
    return {
        appId: appRecord.id,
        versionId: versionRecord.id,
        buildId: build.id,
        appName: payload.appName,
        identifier: payload.identifier,
        version: payload.version,
        buildNumber: payload.buildNumber,
        targets: payload.targets,
        distribution: payload.entitlements?.distribution,
    };
}
export async function ingestAndroidFromFunction(payload, storageKey, sizeBytes, teamId, createdByUserId, options) {
    const billingGuard = options?.billingGuard;
    const appName = payload.appName || deriveAppName(payload.packageName);
    if (billingGuard?.assertCanCreateApp) {
        await billingGuard.assertCanCreateApp({
            teamId,
            userId: createdByUserId,
            identifier: payload.packageName,
        });
    }
    const appRecord = await prisma.app.upsert({
        where: { teamId_identifier: { teamId, identifier: payload.packageName } },
        update: { name: appName },
        create: { identifier: payload.packageName, name: appName, teamId },
    });
    if (billingGuard?.assertCanCreateBuild) {
        await billingGuard.assertCanCreateBuild({ teamId, appId: appRecord.id });
    }
    const versionRecord = await prisma.version.upsert({
        where: {
            appId_version: {
                appId: appRecord.id,
                version: payload.versionName,
            },
        },
        update: {},
        create: { appId: appRecord.id, version: payload.versionName },
    });
    const build = await prisma.build.create({
        data: {
            versionId: versionRecord.id,
            buildNumber: payload.versionCode,
            displayName: appName,
            storageKind: "s3",
            storagePath: storageKey,
            sizeBytes,
            createdByUserId,
        },
    });
    let iconBitmap;
    if (payload.iconBase64 && payload.iconWidth && payload.iconHeight) {
        iconBitmap = writeIconBitmap(payload.packageName, payload.iconBase64, payload.iconWidth, payload.iconHeight, payload.iconBytes, payload.iconSourcePath);
    }
    const target = await prisma.target.create({
        data: {
            buildId: build.id,
            platform: PlatformKind.android,
            role: TargetRole.app,
            bundleId: payload.packageName,
            metadata: {
                name: appName,
                version: payload.versionName,
                build: payload.versionCode,
                iconBitmap,
                manifest: {
                    packageName: payload.packageName,
                    versionName: payload.versionName,
                    versionCode: payload.versionCode,
                    minSdk: payload.minSdk,
                    targetSdk: payload.targetSdk,
                    permissions: payload.permissions,
                    icon: payload.manifest?.icon ?? payload.iconSourcePath ?? "",
                },
                permissions: payload.permissions,
                icons: payload.iconSourcePath ? [{ density: "best", path: payload.iconSourcePath }] : [],
            },
        },
    });
    return {
        appId: appRecord.id,
        versionId: versionRecord.id,
        buildId: build.id,
        targetId: target.id,
        packageName: payload.packageName,
        versionName: payload.versionName,
        versionCode: payload.versionCode,
        appName,
        minSdk: payload.minSdk,
        targetSdk: payload.targetSdk,
        permissions: payload.permissions,
        icons: payload.iconSourcePath ? [{ density: "best", path: payload.iconSourcePath }] : [],
        iconBitmap,
        manifest: {
            packageName: payload.packageName,
            versionName: payload.versionName,
            versionCode: payload.versionCode,
            minSdk: payload.minSdk,
            targetSdk: payload.targetSdk,
            permissions: payload.permissions,
            icon: payload.manifest?.icon ?? payload.iconSourcePath ?? "",
        },
    };
}

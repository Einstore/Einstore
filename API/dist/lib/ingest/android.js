import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ApkReader from "@devicefarmer/adbkit-apkreader";
import { prisma } from "../prisma.js";
import { listZipEntries, scanZipEntries } from "../zip.js";
const parseMatch = (line, key) => {
    const match = line.match(new RegExp(`${key}='([^']+)'`));
    return match?.[1];
};
const parseKeyValue = (line) => {
    const match = line.match(/'([^']+)'/);
    return match?.[1];
};
const resolveAaptCandidates = () => {
    const candidates = [];
    if (process.env.AAPT_PATH) {
        candidates.push(process.env.AAPT_PATH);
    }
    candidates.push("aapt", "aapt2");
    return candidates;
};
const parseWithAapt = (filePath) => {
    for (const candidate of resolveAaptCandidates()) {
        try {
            return execFileSync(candidate, ["dump", "badging", filePath], {
                encoding: "utf8",
            });
        }
        catch {
            continue;
        }
    }
    return null;
};
const parseWithBundledAapt = (filePath) => {
    try {
        const require = createRequire(import.meta.url);
        const moduleEntry = require.resolve("apk-parser3");
        const moduleDir = path.dirname(moduleEntry);
        const exeName = os.type() === "Darwin" ? "aapt-osx" : "aapt-linux";
        const exePath = path.join(moduleDir, "..", exeName);
        if (!fs.existsSync(exePath)) {
            return null;
        }
        return execFileSync(exePath, ["dump", "badging", filePath], {
            encoding: "utf8",
        });
    }
    catch {
        return null;
    }
};
const parseWithReader = async (filePath) => {
    const reader = await ApkReader.open(filePath);
    const manifest = await reader.readManifest();
    const permissions = Array.isArray(manifest.usesPermissions)
        ? manifest.usesPermissions.map((permission) => typeof permission === "string" ? permission : permission.name || "")
        : [];
    const appLabel = manifest.application?.label || "";
    const icon = manifest.application?.icon || "";
    return {
        packageName: manifest.package || "",
        versionName: manifest.versionName ? String(manifest.versionName) : "",
        versionCode: manifest.versionCode ? String(manifest.versionCode) : "",
        minSdk: manifest.usesSdk?.minSdkVersion ? String(manifest.usesSdk.minSdkVersion) : undefined,
        targetSdk: manifest.usesSdk?.targetSdkVersion ? String(manifest.usesSdk.targetSdkVersion) : undefined,
        appName: appLabel ? String(appLabel) : "",
        permissions: permissions.filter(Boolean),
        icons: icon ? [{ density: "resource", path: String(icon) }] : [],
    };
};
const deriveAppName = (packageName) => {
    const segment = packageName.split(".").filter(Boolean).pop() || packageName;
    if (!segment)
        return packageName;
    if (segment.toLowerCase().startsWith("gp") && segment.length > 2) {
        return `GP${segment.slice(2, 3).toUpperCase()}${segment.slice(3)}`;
    }
    return `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`;
};
const readPngDimensions = (buffer) => {
    if (buffer.length < 24)
        return null;
    const signature = buffer.subarray(0, 8);
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (!signature.equals(pngSignature))
        return null;
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (!width || !height)
        return null;
    return { width, height };
};
const extractBestIconBitmap = async (apkPath, outputDir, iconEntries) => {
    let entries = iconEntries?.filter((name) => name.toLowerCase().endsWith(".png")) ?? [];
    if (!entries.length) {
        const zipEntries = await listZipEntries(apkPath);
        entries = zipEntries.filter((name) => name.startsWith("res/") && name.endsWith(".png"));
    }
    const candidates = entries
        .map((name) => {
        const lower = name.toLowerCase();
        const filename = lower.split("/").pop() || "";
        const score = (lower.includes("mipmap") ? 10 : 0) +
            (filename.includes("ic_launcher") || filename.includes("app_icon") ? 8 : 0) +
            (filename.includes("launcher") ? 4 : 0) +
            (filename.includes("icon") ? 2 : 0);
        return { name, score };
    });
    let best = null;
    const candidateScores = new Map(candidates.map((candidate) => [candidate.name, candidate.score]));
    await scanZipEntries(apkPath, (entryName) => candidateScores.has(entryName), async (entryName, buffer) => {
        const dimensions = readPngDimensions(buffer);
        if (!dimensions)
            return;
        const size = buffer.length;
        const score = candidateScores.get(entryName) ?? 0;
        if (!best ||
            dimensions.width * dimensions.height > best.width * best.height ||
            (dimensions.width * dimensions.height === best.width * best.height && score > best.score)) {
            best = {
                name: entryName,
                score,
                width: dimensions.width,
                height: dimensions.height,
                size,
                buffer,
            };
        }
    });
    if (!best)
        return null;
    const resolved = best;
    fs.mkdirSync(outputDir, { recursive: true });
    const fileName = `icon-${resolved.width}x${resolved.height}.png`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, resolved.buffer);
    return {
        sourcePath: resolved.name,
        path: filePath,
        width: resolved.width,
        height: resolved.height,
        sizeBytes: resolved.size,
    };
};
export async function ingestAndroidApk(filePath, teamId, createdByUserId, options) {
    if (!fs.existsSync(filePath)) {
        throw new Error("APK not found");
    }
    const billingGuard = options?.billingGuard;
    const stats = fs.statSync(filePath);
    const output = parseWithAapt(filePath) ?? parseWithBundledAapt(filePath);
    let packageName = "";
    let versionCode = "";
    let versionName = "";
    let appName = "";
    let minSdk;
    let targetSdk;
    const permissions = [];
    const icons = [];
    if (output) {
        for (const line of output.split(/\r?\n/)) {
            if (line.startsWith("package:")) {
                packageName = parseMatch(line, "name") || packageName;
                versionCode = parseMatch(line, "versionCode") || versionCode;
                versionName = parseMatch(line, "versionName") || versionName;
            }
            else if (line.startsWith("sdkVersion:")) {
                minSdk = parseKeyValue(line);
            }
            else if (line.startsWith("targetSdkVersion:")) {
                targetSdk = parseKeyValue(line);
            }
            else if (line.startsWith("uses-permission:")) {
                const permission = parseMatch(line, "name");
                if (permission)
                    permissions.push(permission);
            }
            else if (line.startsWith("application-label:")) {
                appName = parseKeyValue(line) || appName;
            }
            else if (line.startsWith("application-icon-")) {
                const density = line.split(":")[0].replace("application-icon-", "").trim();
                const path = parseKeyValue(line);
                if (path)
                    icons.push({ density, path });
            }
            else if (line.startsWith("application:")) {
                if (!appName) {
                    appName = parseMatch(line, "label") || appName;
                }
                if (!icons.length) {
                    const iconPath = parseMatch(line, "icon");
                    if (iconPath)
                        icons.push({ density: "default", path: iconPath });
                }
            }
        }
    }
    else {
        const parsed = await parseWithReader(filePath);
        packageName = parsed.packageName;
        versionCode = parsed.versionCode;
        versionName = parsed.versionName;
        appName = parsed.appName;
        minSdk = parsed.minSdk;
        targetSdk = parsed.targetSdk;
        permissions.push(...parsed.permissions);
        icons.push(...parsed.icons);
    }
    if (!packageName) {
        throw new Error("Missing package name in APK metadata");
    }
    const resolvedAppName = appName || packageName;
    const resolvedAppNameNormalized = resolvedAppName.startsWith("resourceId:") || !resolvedAppName
        ? deriveAppName(packageName)
        : resolvedAppName;
    const resolvedVersion = versionName || versionCode || "1.0.0";
    const resolvedBuild = versionCode || "1";
    const manifest = {
        packageName,
        versionName: versionName || "",
        versionCode: versionCode || "",
        minSdk,
        targetSdk,
        permissions,
        icon: icons[0]?.path,
    };
    if (billingGuard?.assertCanCreateApp) {
        await billingGuard.assertCanCreateApp({
            teamId,
            userId: createdByUserId,
            identifier: packageName,
        });
    }
    const appRecord = await prisma.app.upsert({
        where: { teamId_identifier: { teamId, identifier: packageName } },
        update: { name: resolvedAppNameNormalized },
        create: { identifier: packageName, name: resolvedAppNameNormalized, teamId },
    });
    if (billingGuard?.assertCanCreateBuild) {
        await billingGuard.assertCanCreateBuild({ teamId, appId: appRecord.id });
    }
    const versionRecord = await prisma.version.upsert({
        where: {
            appId_version: {
                appId: appRecord.id,
                version: resolvedVersion,
            },
        },
        update: {},
        create: { appId: appRecord.id, version: resolvedVersion },
    });
    const build = await prisma.build.create({
        data: {
            versionId: versionRecord.id,
            buildNumber: resolvedBuild,
            displayName: resolvedAppNameNormalized,
            storageKind: "local",
            storagePath: filePath,
            sizeBytes: stats.size,
            createdByUserId,
        },
    });
    const iconOutputDir = path.resolve(process.cwd(), "storage", "ingest", build.id);
    const iconBitmap = await extractBestIconBitmap(filePath, iconOutputDir, icons.map((icon) => icon.path));
    const target = await prisma.target.create({
        data: {
            buildId: build.id,
            platform: "android",
            role: "app",
            bundleId: packageName,
            metadata: {
                minSdk,
                targetSdk,
                versionCode,
                versionName,
                icons,
                iconBitmap,
            },
        },
    });
    if (permissions.length) {
        await prisma.capability.createMany({
            data: permissions.map((permission) => ({
                targetId: target.id,
                name: permission,
                metadata: { kind: "android-permission" },
            })),
            skipDuplicates: true,
        });
    }
    await prisma.complianceArtifact.create({
        data: {
            buildId: build.id,
            kind: "permissions",
            storageKind: "local",
            storagePath: filePath,
            metadata: {
                manifest,
                permissions,
                minSdk,
                targetSdk,
                versionCode,
                versionName,
                icons,
                iconBitmap,
            },
        },
    });
    return {
        appId: appRecord.id,
        versionId: versionRecord.id,
        buildId: build.id,
        targetId: target.id,
        packageName,
        versionName: resolvedVersion,
        versionCode: resolvedBuild,
        appName: resolvedAppNameNormalized,
        minSdk,
        targetSdk,
        permissions,
        icons,
        iconBitmap: iconBitmap
            ? {
                path: iconBitmap.path,
                width: iconBitmap.width,
                height: iconBitmap.height,
                sizeBytes: iconBitmap.sizeBytes,
            }
            : undefined,
        manifest,
    };
}

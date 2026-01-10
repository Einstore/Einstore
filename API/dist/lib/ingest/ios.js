import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import plist from "plist";
import { prisma } from "../prisma.js";
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
const mapDeviceFamily = (family) => {
    if (!Array.isArray(family))
        return [];
    return family.map((value) => {
        switch (value) {
            case 1:
                return "iphone";
            case 2:
                return "ipad";
            case 3:
                return "appletv";
            case 4:
                return "watch";
            case 6:
                return "carplay";
            default:
                return `unknown-${value}`;
        }
    });
};
const sanitizePathSegment = (value) => value.replace(/[^a-zA-Z0-9._-]+/g, "_");
const resolveIconCandidates = (info) => {
    const icons = info.CFBundleIcons;
    const primary = icons?.CFBundlePrimaryIcon;
    const iconFiles = primary?.CFBundleIconFiles || [];
    const iconName = primary?.CFBundleIconName;
    const plistIcons = info.CFBundleIconFiles || [];
    const candidates = new Set();
    for (const entry of [...iconFiles, ...plistIcons]) {
        if (!entry)
            continue;
        candidates.add(entry);
        candidates.add(`${entry}.png`);
    }
    if (iconName) {
        candidates.add(iconName);
        candidates.add(`${iconName}.png`);
    }
    return Array.from(candidates);
};
const extractBestIcon = (zip, targetRoot, outputDir, info) => {
    const entries = zip.getEntries();
    const targetEntries = entries.filter((entry) => !entry.isDirectory && entry.entryName.startsWith(targetRoot));
    const candidates = resolveIconCandidates(info);
    let best = null;
    const pickFromEntry = (entryName) => {
        const entry = zip.getEntry(entryName);
        if (!entry)
            return;
        const buffer = entry.getData();
        const dimensions = readPngDimensions(buffer);
        if (!dimensions)
            return;
        const size = buffer.length;
        if (!best ||
            dimensions.width * dimensions.height > best.width * best.height ||
            (dimensions.width * dimensions.height === best.width * best.height &&
                size > best.size)) {
            best = {
                entryName,
                width: dimensions.width,
                height: dimensions.height,
                size,
                buffer,
            };
        }
    };
    if (candidates.length) {
        for (const candidate of candidates) {
            const entry = targetEntries.find((item) => item.entryName.toLowerCase().endsWith(`/${candidate.toLowerCase()}`));
            if (entry) {
                pickFromEntry(entry.entryName);
            }
        }
    }
    if (!best) {
        for (const entry of targetEntries) {
            const lower = entry.entryName.toLowerCase();
            if (!lower.endsWith(".png"))
                continue;
            if (lower.includes("appicon") || lower.includes("icon") || lower.includes("launcher")) {
                pickFromEntry(entry.entryName);
            }
        }
    }
    if (!best) {
        for (const entry of targetEntries) {
            if (!entry.entryName.toLowerCase().endsWith(".png"))
                continue;
            pickFromEntry(entry.entryName);
        }
    }
    if (!best)
        return null;
    const resolved = best;
    fs.mkdirSync(outputDir, { recursive: true });
    const fileName = `icon-${resolved.width}x${resolved.height}.png`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, resolved.buffer);
    return {
        sourcePath: resolved.entryName,
        path: filePath,
        width: resolved.width,
        height: resolved.height,
        sizeBytes: resolved.size,
    };
};
const parsePlist = (buffer) => plist.parse(buffer.toString("utf8"));
const normalizeJson = (value) => JSON.parse(JSON.stringify(value ?? null));
const resolveRole = (extensionPoint) => {
    if (!extensionPoint)
        return "app";
    const lower = extensionPoint.toLowerCase();
    if (lower.includes("widget"))
        return "widget";
    if (lower.includes("clip"))
        return "clip";
    return "extension";
};
const resolveTargetRoots = (zip) => {
    const roots = new Set();
    for (const entry of zip.getEntries()) {
        if (entry.isDirectory && entry.entryName.match(/^Payload\/[^/]+\.app\/$/)) {
            roots.add(entry.entryName);
        }
    }
    for (const entry of zip.getEntries()) {
        if (entry.isDirectory && entry.entryName.match(/^Payload\/[^/]+\.app\/.*\.appex\/$/)) {
            roots.add(entry.entryName);
        }
    }
    for (const entry of zip.getEntries()) {
        if (entry.isDirectory && entry.entryName.match(/^Payload\/[^/]+\.app\/Watch\/[^/]+\.app\/$/)) {
            roots.add(entry.entryName);
        }
    }
    return Array.from(roots);
};
export async function ingestIosIpa(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error("IPA not found");
    }
    const stats = fs.statSync(filePath);
    const zip = new AdmZip(filePath);
    const targetRoots = resolveTargetRoots(zip);
    if (!targetRoots.length) {
        throw new Error("No app bundles found in IPA");
    }
    const targets = [];
    for (const root of targetRoots) {
        const plistEntry = zip.getEntry(`${root}Info.plist`);
        if (!plistEntry)
            continue;
        const info = parsePlist(plistEntry.getData());
        const bundleId = String(info.CFBundleIdentifier || "");
        if (!bundleId)
            continue;
        const name = String(info.CFBundleDisplayName || info.CFBundleName || info.CFBundleExecutable || bundleId);
        const version = String(info.CFBundleShortVersionString || info.CFBundleVersion || "");
        const build = String(info.CFBundleVersion || "");
        const deviceFamily = Array.isArray(info.UIDeviceFamily)
            ? info.UIDeviceFamily
            : undefined;
        const supportedDevices = mapDeviceFamily(deviceFamily);
        const orientations = [
            ...(Array.isArray(info.UISupportedInterfaceOrientations)
                ? info.UISupportedInterfaceOrientations
                : []),
            ...(Array.isArray(info["UISupportedInterfaceOrientations~ipad"])
                ? info["UISupportedInterfaceOrientations~ipad"]
                : []),
        ];
        const minOsVersion = info.MinimumOSVersion ? String(info.MinimumOSVersion) : undefined;
        const extension = info.NSExtension;
        const extensionPoint = extension?.NSExtensionPointIdentifier
            ? String(extension.NSExtensionPointIdentifier)
            : undefined;
        const platform = supportedDevices.includes("watch") || info.WKWatchKitApp ? "watchos" : "ios";
        const role = resolveRole(extensionPoint);
        const iconOutputDir = path.resolve(process.cwd(), "storage", "ingest", sanitizePathSegment(bundleId));
        const iconBitmap = extractBestIcon(zip, root, iconOutputDir, info);
        targets.push({
            name,
            bundleId,
            role,
            platform,
            version,
            build,
            supportedDevices,
            orientations,
            minOsVersion,
            iconBitmap: iconBitmap || undefined,
            info: normalizeJson(info),
        });
    }
    const mainTarget = targets.find((target) => target.role === "app") || targets[0];
    if (!mainTarget) {
        throw new Error("Unable to determine primary app target");
    }
    const resolvedAppName = mainTarget.name;
    const resolvedVersion = mainTarget.version || "1.0.0";
    const resolvedBuild = mainTarget.build || "1";
    const appRecord = await prisma.app.upsert({
        where: { identifier: mainTarget.bundleId },
        update: { name: resolvedAppName },
        create: { identifier: mainTarget.bundleId, name: resolvedAppName },
    });
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
            displayName: resolvedAppName,
            storageKind: "local",
            storagePath: filePath,
            sizeBytes: stats.size,
        },
    });
    for (const target of targets) {
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
                    iconBitmap: target.iconBitmap,
                    info: normalizeJson(target.info),
                },
            },
        });
    }
    await prisma.complianceArtifact.create({
        data: {
            buildId: build.id,
            kind: "manifest",
            storageKind: "local",
            storagePath: filePath,
            metadata: normalizeJson({
                appName: resolvedAppName,
                identifier: mainTarget.bundleId,
                version: resolvedVersion,
                buildNumber: resolvedBuild,
                targets,
            }),
        },
    });
    return {
        appId: appRecord.id,
        versionId: versionRecord.id,
        buildId: build.id,
        appName: resolvedAppName,
        identifier: mainTarget.bundleId,
        version: resolvedVersion,
        buildNumber: resolvedBuild,
        targets,
    };
}

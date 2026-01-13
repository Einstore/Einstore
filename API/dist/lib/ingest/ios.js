import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import plist from "plist";
import bplistParser from "bplist-parser";
import { prisma } from "../prisma.js";
import { listZipEntries, readZipEntries, scanZipEntries } from "../zip.js";
import { extractIosEntitlements, } from "./ios-entitlements.js";
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
const commandAvailability = new Map();
const hasCommand = (command) => {
    const cached = commandAvailability.get(command);
    if (cached !== undefined)
        return cached;
    const result = spawnSync("sh", ["-c", `command -v ${command}`], { stdio: "ignore" });
    const available = result.status === 0;
    commandAvailability.set(command, available);
    return available;
};
const runCommand = (command, args) => {
    const result = spawnSync(command, args, { stdio: "pipe" });
    if (result.status !== 0) {
        const stderr = result.stderr?.toString("utf8").trim();
        const stdout = result.stdout?.toString("utf8").trim();
        const message = [stderr, stdout].filter(Boolean).join("\n");
        throw new Error(message || `${command} failed`);
    }
};
const safeUnlink = (filePath, keepPath) => {
    if (filePath === keepPath)
        return;
    if (!fs.existsSync(filePath))
        return;
    fs.unlinkSync(filePath);
};
const normalizeIosPng = (rawPath, finalPath) => {
    const baseName = finalPath.replace(/\.png$/i, "");
    const revertedPath = `${baseName}.reverted.png`;
    const normalizedPath = `${baseName}.normalized.png`;
    let workingPath = rawPath;
    if (hasCommand("pngcrush")) {
        try {
            runCommand("pngcrush", ["-revert-iphone-optimizations", rawPath, revertedPath]);
            workingPath = revertedPath;
        }
        catch (error) {
            console.warn("pngcrush failed, using raw icon PNG.", error);
        }
    }
    const magickCommand = hasCommand("magick")
        ? "magick"
        : hasCommand("convert")
            ? "convert"
            : null;
    if (magickCommand) {
        try {
            runCommand(magickCommand, [
                workingPath,
                "-alpha",
                "on",
                "-colorspace",
                "sRGB",
                "-strip",
                normalizedPath,
            ]);
            workingPath = normalizedPath;
        }
        catch (error) {
            console.warn("ImageMagick normalization failed, using existing icon PNG.", error);
        }
    }
    if (hasCommand("pngcheck")) {
        try {
            runCommand("pngcheck", ["-v", workingPath]);
        }
        catch (error) {
            console.warn("pngcheck reported issues with icon PNG.", error);
        }
    }
    if (workingPath !== finalPath) {
        if (fs.existsSync(finalPath)) {
            fs.unlinkSync(finalPath);
        }
        fs.renameSync(workingPath, finalPath);
    }
    safeUnlink(rawPath, finalPath);
    safeUnlink(revertedPath, finalPath);
    safeUnlink(normalizedPath, finalPath);
    return finalPath;
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
const extractBestIcon = async (filePath, targetRoot, entries, outputDir, info) => {
    const targetEntries = entries.filter((entry) => !entry.endsWith("/") && entry.startsWith(targetRoot));
    const candidates = resolveIconCandidates(info);
    let best = null;
    const pickFromEntries = async (entryNames) => {
        if (!entryNames.length)
            return;
        const wanted = new Set(entryNames);
        await scanZipEntries(filePath, (entryName) => wanted.has(entryName), async (entryName, buffer) => {
            const dimensions = readPngDimensions(buffer);
            if (!dimensions)
                return;
            const size = buffer.length;
            if (!best ||
                dimensions.width * dimensions.height > best.width * best.height ||
                (dimensions.width * dimensions.height === best.width * best.height && size > best.size)) {
                best = {
                    entryName,
                    width: dimensions.width,
                    height: dimensions.height,
                    size,
                    buffer,
                };
            }
        });
    };
    if (candidates.length) {
        const candidateEntries = [];
        for (const candidate of candidates) {
            const entry = targetEntries.find((item) => item.toLowerCase().endsWith(`/${candidate.toLowerCase()}`));
            if (entry) {
                candidateEntries.push(entry);
            }
        }
        await pickFromEntries(candidateEntries);
    }
    if (!best) {
        const fallbackEntries = targetEntries.filter((entry) => {
            const lower = entry.toLowerCase();
            return (lower.endsWith(".png") &&
                (lower.includes("appicon") || lower.includes("icon") || lower.includes("launcher")));
        });
        await pickFromEntries(fallbackEntries);
    }
    if (!best) {
        const allPngEntries = targetEntries.filter((entry) => entry.toLowerCase().endsWith(".png"));
        await pickFromEntries(allPngEntries);
    }
    if (!best)
        return null;
    const resolved = best;
    fs.mkdirSync(outputDir, { recursive: true });
    const baseName = `icon-${resolved.width}x${resolved.height}`;
    const rawPath = path.join(outputDir, `${baseName}.raw.png`);
    const iconPath = path.join(outputDir, `${baseName}.png`);
    fs.writeFileSync(rawPath, resolved.buffer);
    const normalizedPath = normalizeIosPng(rawPath, iconPath);
    const normalizedStats = fs.statSync(normalizedPath);
    return {
        sourcePath: resolved.entryName,
        path: normalizedPath,
        width: resolved.width,
        height: resolved.height,
        sizeBytes: normalizedStats.size,
    };
};
const parsePlist = (buffer) => {
    const header = buffer.subarray(0, 6).toString("utf8");
    if (header === "bplist") {
        const parsed = bplistParser.parseBuffer(buffer);
        return (parsed[0] ?? {});
    }
    const text = buffer.toString("utf8").trim();
    if (!text)
        return {};
    return plist.parse(text);
};
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
const resolveTargetRoots = (entries) => {
    const roots = new Set();
    for (const entry of entries) {
        if (entry.match(/^Payload\/[^/]+\.app\/Info\.plist$/)) {
            roots.add(entry.replace(/Info\.plist$/, ""));
        }
        if (entry.match(/^Payload\/[^/]+\.app\/PlugIns\/[^/]+\.appex\/Info\.plist$/)) {
            roots.add(entry.replace(/Info\.plist$/, ""));
        }
        if (entry.match(/^Payload\/[^/]+\.app\/Watch\/[^/]+\.app\/Info\.plist$/)) {
            roots.add(entry.replace(/Info\.plist$/, ""));
        }
    }
    return Array.from(roots);
};
export async function ingestIosIpa(filePath, teamId, createdByUserId) {
    if (!fs.existsSync(filePath)) {
        throw new Error("IPA not found");
    }
    const stats = fs.statSync(filePath);
    const entryNames = await listZipEntries(filePath);
    const targetRoots = resolveTargetRoots(entryNames);
    if (!targetRoots.length) {
        throw new Error("No app bundles found in IPA");
    }
    const targets = [];
    const targetRootsByBundleId = new Map();
    const plistPaths = targetRoots.map((root) => `${root}Info.plist`);
    const plistBuffers = await readZipEntries(filePath, new Set(plistPaths));
    for (const root of targetRoots) {
        const plistBuffer = plistBuffers.get(`${root}Info.plist`);
        if (!plistBuffer)
            continue;
        const info = parsePlist(plistBuffer);
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
        const iconBitmap = await extractBestIcon(filePath, root, entryNames, iconOutputDir, info);
        targetRootsByBundleId.set(bundleId, root);
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
    const mainTargetRoot = targetRootsByBundleId.get(mainTarget.bundleId);
    const entitlementsInfo = mainTargetRoot
        ? await extractIosEntitlements(filePath, entryNames, mainTargetRoot)
        : { distribution: { kind: "broken", reason: "main_target_root_missing" } };
    const resolvedAppName = mainTarget.name;
    const resolvedVersion = mainTarget.version || "1.0.0";
    const resolvedBuild = mainTarget.build || "1";
    const appRecord = await prisma.app.upsert({
        where: { teamId_identifier: { teamId, identifier: mainTarget.bundleId } },
        update: { name: resolvedAppName },
        create: { identifier: mainTarget.bundleId, name: resolvedAppName, teamId },
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
            createdByUserId,
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
    await prisma.complianceArtifact.create({
        data: {
            buildId: build.id,
            kind: "entitlements",
            storageKind: "local",
            storagePath: filePath,
            metadata: normalizeJson({
                distribution: entitlementsInfo.distribution,
                entitlements: entitlementsInfo.entitlements,
                entitlementsSource: entitlementsInfo.entitlementsSource,
                provisioningProfile: entitlementsInfo.provisioningProfile,
                provisioningProfileSource: entitlementsInfo.provisioningProfileSource,
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
        distribution: entitlementsInfo.distribution,
    };
}

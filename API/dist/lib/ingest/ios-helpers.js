import plist from "plist";
import bplistParser from "bplist-parser";
export const mapDeviceFamily = (family) => {
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
export const sanitizePathSegment = (value) => value.replace(/[^a-zA-Z0-9._-]+/g, "_");
export const resolveIconCandidates = (info) => {
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
export const parsePlist = (buffer) => {
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
export const normalizeJson = (value) => JSON.parse(JSON.stringify(value ?? null));
export const resolveRole = (extensionPoint) => {
    if (!extensionPoint)
        return "app";
    const lower = extensionPoint.toLowerCase();
    if (lower.includes("widget"))
        return "widget";
    if (lower.includes("clip"))
        return "clip";
    return "extension";
};
export const resolveTargetRoots = (entries) => {
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

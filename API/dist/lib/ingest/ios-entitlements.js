import plist from "plist";
import { readZipEntries } from "../zip.js";
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const tryParsePlist = (buffer) => {
    try {
        return plist.parse(buffer.toString("utf8"));
    }
    catch (error) {
        return null;
    }
};
const extractXmlPlist = (buffer) => {
    const xmlStart = buffer.indexOf("<?xml");
    const plistStart = buffer.indexOf("<plist");
    const start = xmlStart !== -1 ? xmlStart : plistStart;
    const end = buffer.indexOf("</plist>");
    if (start === -1 || end === -1 || end <= start)
        return null;
    return buffer.subarray(start, end + "</plist>".length).toString("utf8");
};
const parseEmbeddedMobileProvision = (buffer) => {
    const xml = extractXmlPlist(buffer);
    if (!xml)
        return null;
    try {
        return plist.parse(xml);
    }
    catch (error) {
        return null;
    }
};
const summarizeProvisioningProfile = (profile) => {
    const provisionedDevices = Array.isArray(profile.ProvisionedDevices)
        ? profile.ProvisionedDevices.filter((item) => typeof item === "string")
        : [];
    const teamIdentifier = Array.isArray(profile.TeamIdentifier)
        ? profile.TeamIdentifier.filter((item) => typeof item === "string")
        : undefined;
    return {
        name: typeof profile.Name === "string" ? profile.Name : undefined,
        uuid: typeof profile.UUID === "string" ? profile.UUID : undefined,
        teamIdentifier,
        teamName: typeof profile.TeamName === "string" ? profile.TeamName : undefined,
        appIdName: typeof profile.AppIDName === "string" ? profile.AppIDName : undefined,
        creationDate: profile.CreationDate instanceof Date || typeof profile.CreationDate === "string"
            ? profile.CreationDate
            : undefined,
        expirationDate: profile.ExpirationDate instanceof Date || typeof profile.ExpirationDate === "string"
            ? profile.ExpirationDate
            : undefined,
        provisionsAllDevices: profile.ProvisionsAllDevices === true,
        provisionedDevicesCount: provisionedDevices.length || undefined,
    };
};
const resolveDistributionFromProfile = (profile) => {
    if (!profile) {
        return { kind: "broken", reason: "provisioning_profile_unreadable" };
    }
    if (profile.ProvisionsAllDevices === true) {
        return { kind: "enterprise", reason: "provisions_all_devices" };
    }
    const provisionedDevices = Array.isArray(profile.ProvisionedDevices)
        ? profile.ProvisionedDevices
        : [];
    if (provisionedDevices.length) {
        return { kind: "adhoc", reason: "provisioned_devices_present" };
    }
    return { kind: "appstore", reason: "no_provisioned_devices" };
};
export async function extractIosEntitlements(filePath, entryNames, targetRoot) {
    const provisioningProfileEntry = entryNames.find((entry) => entry === `${targetRoot}embedded.mobileprovision`);
    const explicitXcentEntry = entryNames.find((entry) => entry === `${targetRoot}archived-expanded-entitlements.xcent`) ??
        entryNames.find((entry) => entry.startsWith(targetRoot) && entry.toLowerCase().endsWith(".xcent"));
    const wantedEntries = new Set();
    if (provisioningProfileEntry) {
        wantedEntries.add(provisioningProfileEntry);
    }
    if (explicitXcentEntry) {
        wantedEntries.add(explicitXcentEntry);
    }
    const buffers = wantedEntries.size > 0 ? await readZipEntries(filePath, wantedEntries) : new Map();
    let entitlements = null;
    let entitlementsSource;
    if (explicitXcentEntry) {
        const entitlementsBuffer = buffers.get(explicitXcentEntry);
        if (entitlementsBuffer) {
            entitlements = tryParsePlist(entitlementsBuffer);
            entitlementsSource = entitlements ? explicitXcentEntry : `${explicitXcentEntry} (unreadable)`;
        }
    }
    let provisioningProfile = null;
    let provisioningProfileSource;
    let distribution = {
        kind: "none",
        reason: "provisioning_profile_missing",
    };
    if (provisioningProfileEntry) {
        const profileBuffer = buffers.get(provisioningProfileEntry);
        provisioningProfileSource = provisioningProfileEntry;
        if (!profileBuffer) {
            distribution = { kind: "broken", reason: "provisioning_profile_unreadable" };
        }
        else {
            provisioningProfile = parseEmbeddedMobileProvision(profileBuffer);
            distribution = resolveDistributionFromProfile(provisioningProfile);
        }
    }
    if (!entitlements && provisioningProfile && isRecord(provisioningProfile.Entitlements)) {
        entitlements = provisioningProfile.Entitlements;
        entitlementsSource = `${provisioningProfileEntry}:Entitlements`;
    }
    return {
        distribution,
        entitlements,
        entitlementsSource,
        provisioningProfile: provisioningProfile ? summarizeProvisioningProfile(provisioningProfile) : null,
        provisioningProfileSource,
    };
}

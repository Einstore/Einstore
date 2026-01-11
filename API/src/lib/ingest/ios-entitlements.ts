import plist from "plist";
import { readZipEntries } from "../zip.js";

export type IosDistributionType = "adhoc" | "appstore" | "enterprise" | "none" | "broken";

export type IosDistributionInfo = {
  kind: IosDistributionType;
  reason: string;
};

export type ProvisioningProfileSummary = {
  name?: string;
  uuid?: string;
  teamIdentifier?: string[];
  teamName?: string;
  appIdName?: string;
  creationDate?: string | Date;
  expirationDate?: string | Date;
  provisionsAllDevices?: boolean;
  provisionedDevicesCount?: number;
};

export type IosEntitlementsInfo = {
  distribution: IosDistributionInfo;
  entitlements?: Record<string, unknown> | null;
  entitlementsSource?: string;
  provisioningProfile?: ProvisioningProfileSummary | null;
  provisioningProfileSource?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const tryParsePlist = (buffer: Buffer) => {
  try {
    return plist.parse(buffer.toString("utf8")) as Record<string, unknown>;
  } catch (error) {
    return null;
  }
};

const extractXmlPlist = (buffer: Buffer) => {
  const xmlStart = buffer.indexOf("<?xml");
  const plistStart = buffer.indexOf("<plist");
  const start = xmlStart !== -1 ? xmlStart : plistStart;
  const end = buffer.indexOf("</plist>");
  if (start === -1 || end === -1 || end <= start) return null;
  return buffer.subarray(start, end + "</plist>".length).toString("utf8");
};

const parseEmbeddedMobileProvision = (buffer: Buffer) => {
  const xml = extractXmlPlist(buffer);
  if (!xml) return null;
  try {
    return plist.parse(xml) as Record<string, unknown>;
  } catch (error) {
    return null;
  }
};

const summarizeProvisioningProfile = (profile: Record<string, unknown>): ProvisioningProfileSummary => {
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
    creationDate:
      profile.CreationDate instanceof Date || typeof profile.CreationDate === "string"
        ? profile.CreationDate
        : undefined,
    expirationDate:
      profile.ExpirationDate instanceof Date || typeof profile.ExpirationDate === "string"
        ? profile.ExpirationDate
        : undefined,
    provisionsAllDevices: profile.ProvisionsAllDevices === true,
    provisionedDevicesCount: provisionedDevices.length || undefined,
  };
};

const resolveDistributionFromProfile = (profile: Record<string, unknown> | null): IosDistributionInfo => {
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

export async function extractIosEntitlements(
  filePath: string,
  entryNames: string[],
  targetRoot: string,
): Promise<IosEntitlementsInfo> {
  const provisioningProfileEntry = entryNames.find(
    (entry) => entry === `${targetRoot}embedded.mobileprovision`,
  );
  const explicitXcentEntry =
    entryNames.find((entry) => entry === `${targetRoot}archived-expanded-entitlements.xcent`) ??
    entryNames.find(
      (entry) => entry.startsWith(targetRoot) && entry.toLowerCase().endsWith(".xcent"),
    );
  const wantedEntries = new Set<string>();
  if (provisioningProfileEntry) {
    wantedEntries.add(provisioningProfileEntry);
  }
  if (explicitXcentEntry) {
    wantedEntries.add(explicitXcentEntry);
  }
  const buffers =
    wantedEntries.size > 0 ? await readZipEntries(filePath, wantedEntries) : new Map();

  let entitlements: Record<string, unknown> | null = null;
  let entitlementsSource: string | undefined;
  if (explicitXcentEntry) {
    const entitlementsBuffer = buffers.get(explicitXcentEntry);
    if (entitlementsBuffer) {
      entitlements = tryParsePlist(entitlementsBuffer);
      entitlementsSource = entitlements ? explicitXcentEntry : `${explicitXcentEntry} (unreadable)`;
    }
  }

  let provisioningProfile: Record<string, unknown> | null = null;
  let provisioningProfileSource: string | undefined;
  let distribution: IosDistributionInfo = {
    kind: "none",
    reason: "provisioning_profile_missing",
  };

  if (provisioningProfileEntry) {
    const profileBuffer = buffers.get(provisioningProfileEntry);
    provisioningProfileSource = provisioningProfileEntry;
    if (!profileBuffer) {
      distribution = { kind: "broken", reason: "provisioning_profile_unreadable" };
    } else {
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

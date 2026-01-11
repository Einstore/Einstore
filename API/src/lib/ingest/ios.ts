import fs from "node:fs";
import path from "node:path";
import plist from "plist";
import { Prisma, PlatformKind, TargetRole } from "@prisma/client";
import { prisma } from "../prisma.js";
import { listZipEntries, readZipEntries, scanZipEntries } from "../zip.js";
import {
  extractIosEntitlements,
  IosDistributionInfo,
  IosEntitlementsInfo,
} from "./ios-entitlements.js";

type IconBitmap = {
  sourcePath: string;
  path: string;
  width: number;
  height: number;
  sizeBytes: number;
};

const readPngDimensions = (buffer: Buffer) => {
  if (buffer.length < 24) return null;
  const signature = buffer.subarray(0, 8);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!signature.equals(pngSignature)) return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!width || !height) return null;
  return { width, height };
};

const mapDeviceFamily = (family?: number[]) => {
  if (!Array.isArray(family)) return [];
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

const sanitizePathSegment = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]+/g, "_");

const resolveIconCandidates = (info: Record<string, unknown>) => {
  const icons = info.CFBundleIcons as Record<string, unknown> | undefined;
  const primary = icons?.CFBundlePrimaryIcon as Record<string, unknown> | undefined;
  const iconFiles = (primary?.CFBundleIconFiles as string[]) || [];
  const iconName = primary?.CFBundleIconName as string | undefined;
  const plistIcons = (info.CFBundleIconFiles as string[]) || [];
  const candidates = new Set<string>();
  for (const entry of [...iconFiles, ...plistIcons]) {
    if (!entry) continue;
    candidates.add(entry);
    candidates.add(`${entry}.png`);
  }
  if (iconName) {
    candidates.add(iconName);
    candidates.add(`${iconName}.png`);
  }
  return Array.from(candidates);
};

const extractBestIcon = async (
  filePath: string,
  targetRoot: string,
  entries: string[],
  outputDir: string,
  info: Record<string, unknown>,
): Promise<IconBitmap | null> => {
  const targetEntries = entries.filter(
    (entry) => !entry.endsWith("/") && entry.startsWith(targetRoot),
  );
  const candidates = resolveIconCandidates(info);

  let best:
    | { entryName: string; width: number; height: number; size: number; buffer: Buffer }
    | null = null;

  const pickFromEntries = async (entryNames: string[]) => {
    if (!entryNames.length) return;
    const wanted = new Set(entryNames);
    await scanZipEntries(filePath, (entryName) => wanted.has(entryName), async (entryName, buffer) => {
      const dimensions = readPngDimensions(buffer);
      if (!dimensions) return;
      const size = buffer.length;
      if (
        !best ||
        dimensions.width * dimensions.height > best.width * best.height ||
        (dimensions.width * dimensions.height === best.width * best.height && size > best.size)
      ) {
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
    const candidateEntries: string[] = [];
    for (const candidate of candidates) {
      const entry = targetEntries.find((item) =>
        item.toLowerCase().endsWith(`/${candidate.toLowerCase()}`),
      );
      if (entry) {
        candidateEntries.push(entry);
      }
    }
    await pickFromEntries(candidateEntries);
  }

  if (!best) {
    const fallbackEntries = targetEntries.filter((entry) => {
      const lower = entry.toLowerCase();
      return (
        lower.endsWith(".png") &&
        (lower.includes("appicon") || lower.includes("icon") || lower.includes("launcher"))
      );
    });
    await pickFromEntries(fallbackEntries);
  }

  if (!best) {
    const allPngEntries = targetEntries.filter((entry) => entry.toLowerCase().endsWith(".png"));
    await pickFromEntries(allPngEntries);
  }

  if (!best) return null;
  const resolved = best as {
    entryName: string;
    width: number;
    height: number;
    size: number;
    buffer: Buffer;
  };
  fs.mkdirSync(outputDir, { recursive: true });
  const fileName = `icon-${resolved.width}x${resolved.height}.png`;
  const iconPath = path.join(outputDir, fileName);
  fs.writeFileSync(iconPath, resolved.buffer);
  return {
    sourcePath: resolved.entryName,
    path: iconPath,
    width: resolved.width,
    height: resolved.height,
    sizeBytes: resolved.size,
  };
};

const parsePlist = (buffer: Buffer) => plist.parse(buffer.toString("utf8")) as Record<string, unknown>;

const normalizeJson = (value: unknown) => JSON.parse(JSON.stringify(value ?? null));

const resolveRole = (extensionPoint?: string) => {
  if (!extensionPoint) return "app";
  const lower = extensionPoint.toLowerCase();
  if (lower.includes("widget")) return "widget";
  if (lower.includes("clip")) return "clip";
  return "extension";
};

const resolveTargetRoots = (entries: string[]) => {
  const roots = new Set<string>();
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

export type IosTarget = {
  name: string;
  bundleId: string;
  role: string;
  platform: string;
  version: string;
  build: string;
  supportedDevices: string[];
  orientations: string[];
  minOsVersion?: string;
  iconBitmap?: IconBitmap;
  info: Record<string, unknown>;
};

export type IosIngestResult = {
  appId: string;
  versionId: string;
  buildId: string;
  appName: string;
  identifier: string;
  version: string;
  buildNumber: string;
  targets: IosTarget[];
  distribution: IosDistributionInfo;
};

export async function ingestIosIpa(
  filePath: string,
  teamId: string,
  createdByUserId?: string,
): Promise<IosIngestResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error("IPA not found");
  }

  const stats = fs.statSync(filePath);
  const entryNames = await listZipEntries(filePath);
  const targetRoots = resolveTargetRoots(entryNames);
  if (!targetRoots.length) {
    throw new Error("No app bundles found in IPA");
  }

  const targets: IosTarget[] = [];
  const targetRootsByBundleId = new Map<string, string>();
  const plistPaths = targetRoots.map((root) => `${root}Info.plist`);
  const plistBuffers = await readZipEntries(filePath, new Set(plistPaths));

  for (const root of targetRoots) {
    const plistBuffer = plistBuffers.get(`${root}Info.plist`);
    if (!plistBuffer) continue;
    const info = parsePlist(plistBuffer);
    const bundleId = String(info.CFBundleIdentifier || "");
    if (!bundleId) continue;
    const name =
      String(info.CFBundleDisplayName || info.CFBundleName || info.CFBundleExecutable || bundleId);
    const version = String(info.CFBundleShortVersionString || info.CFBundleVersion || "");
    const build = String(info.CFBundleVersion || "");
    const deviceFamily = Array.isArray(info.UIDeviceFamily)
      ? (info.UIDeviceFamily as number[])
      : undefined;
    const supportedDevices = mapDeviceFamily(deviceFamily);
    const orientations = [
      ...(Array.isArray(info.UISupportedInterfaceOrientations)
        ? (info.UISupportedInterfaceOrientations as string[])
        : []),
      ...(Array.isArray(info["UISupportedInterfaceOrientations~ipad"])
        ? (info["UISupportedInterfaceOrientations~ipad"] as string[])
        : []),
    ];
    const minOsVersion = info.MinimumOSVersion ? String(info.MinimumOSVersion) : undefined;
    const extension = info.NSExtension as Record<string, unknown> | undefined;
    const extensionPoint = extension?.NSExtensionPointIdentifier
      ? String(extension.NSExtensionPointIdentifier)
      : undefined;
    const platform =
      supportedDevices.includes("watch") || info.WKWatchKitApp ? "watchos" : "ios";
    const role = resolveRole(extensionPoint);
    const iconOutputDir = path.resolve(
      process.cwd(),
      "storage",
      "ingest",
      sanitizePathSegment(bundleId),
    );
    const iconBitmap = await extractBestIcon(
      filePath,
      root,
      entryNames,
      iconOutputDir,
      info,
    );
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
  const entitlementsInfo: IosEntitlementsInfo = mainTargetRoot
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
        platform: target.platform as PlatformKind,
        role: target.role as TargetRole,
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
        } as Prisma.InputJsonValue,
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
      }) as Prisma.InputJsonValue,
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
      }) as Prisma.InputJsonValue,
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

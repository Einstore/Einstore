import { PlatformKind, Prisma, TargetRole } from "@prisma/client";
import { prisma } from "../prisma.js";

type BillingGuard = {
  assertCanCreateApp?: (payload: { teamId: string; userId?: string; identifier?: string }) => Promise<void>;
  assertCanCreateBuild?: (payload: { teamId: string; appId: string }) => Promise<void>;
};

type IngestOptions = {
  billingGuard?: BillingGuard;
};

type FunctionTarget = {
  name: string;
  bundleId: string;
  role: string;
  platform: string;
  version: string;
  build: string;
  supportedDevices: string[];
  orientations: string[];
  minOsVersion?: string;
  info: Record<string, unknown>;
};

type FunctionEntitlements = {
  distribution: { kind: string; reason: string };
  entitlements?: Record<string, unknown> | null;
  entitlementsSource?: string;
  provisioningProfile?: Record<string, unknown> | null;
  provisioningProfileSource?: string;
};

type FunctionIosResult = {
  appName: string;
  identifier: string;
  version: string;
  buildNumber: string;
  targets: FunctionTarget[];
  entitlements?: FunctionEntitlements;
  iconPath?: string | null;
  iconBase64?: string | null;
  iconWidth?: number | null;
  iconHeight?: number | null;
  iconBytes?: number | null;
  iconSourcePath?: string | null;
};

type FunctionAndroidResult = {
  packageName: string;
  versionName: string;
  versionCode: string;
  appName?: string;
  minSdk?: string;
  targetSdk?: string;
  permissions: string[];
  manifest?: {
    packageName: string;
    versionName: string;
    versionCode: string;
    minSdk?: string;
    targetSdk?: string;
    permissions: string[];
    icon?: string;
  };
  iconPath?: string | null;
  iconBase64?: string | null;
  iconWidth?: number | null;
  iconHeight?: number | null;
  iconBytes?: number | null;
  iconSourcePath?: string | null;
};

const deriveAppName = (identifier: string) => {
  const segment = identifier.split(".").filter(Boolean).pop() || identifier;
  if (!segment) return identifier;
  if (segment.toLowerCase().startsWith("gp") && segment.length > 2) {
    return `GP${segment.slice(2, 3).toUpperCase()}${segment.slice(3)}`;
  }
  return `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`;
};

export async function ingestIosFromFunction(
  payload: FunctionIosResult,
  storageKey: string,
  sizeBytes: number,
  teamId: string,
  createdByUserId?: string,
  options?: IngestOptions,
) {
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

  let mainIconBitmap:
    | { sourcePath: string; path: string; width: number; height: number; sizeBytes: number }
    | undefined;
  if (payload.iconPath && payload.iconWidth && payload.iconHeight) {
    mainIconBitmap = {
      sourcePath: payload.iconSourcePath ?? payload.iconPath,
      path: payload.iconPath,
      width: payload.iconWidth,
      height: payload.iconHeight,
      sizeBytes: payload.iconBytes ?? undefined,
    };
  }

  for (const target of payload.targets) {
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
          iconBitmap: target.bundleId === mainTarget.bundleId ? mainIconBitmap : undefined,
          info: target.info,
        } as Prisma.InputJsonValue,
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
      } as Prisma.InputJsonValue,
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
      } as Prisma.InputJsonValue,
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

export async function ingestAndroidFromFunction(
  payload: FunctionAndroidResult,
  storageKey: string,
  sizeBytes: number,
  teamId: string,
  createdByUserId?: string,
  options?: IngestOptions,
) {
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

  let iconBitmap:
    | { sourcePath: string; path: string; width: number; height: number; sizeBytes: number }
    | undefined;
  if (payload.iconPath && payload.iconWidth && payload.iconHeight) {
    iconBitmap = {
      sourcePath: payload.iconSourcePath ?? payload.iconPath,
      path: payload.iconPath,
      width: payload.iconWidth,
      height: payload.iconHeight,
      sizeBytes: payload.iconBytes ?? undefined,
    };
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
      } as Prisma.InputJsonValue,
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

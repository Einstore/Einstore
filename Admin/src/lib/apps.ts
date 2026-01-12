export type ApiApp = {
  id: string;
  name: string;
  identifier: string;
  platform?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiBuild = {
  id: string;
  versionId: string;
  buildNumber: string;
  displayName: string;
  storageKind: "local" | "s3";
  storagePath: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiTarget = {
  id: string;
  platform: string;
  role: string;
  bundleId: string;
  hostTargetId?: string | null;
  minOsVersion?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
};

export type ApiArtifact = {
  id: string;
  buildId: string;
  kind: string;
  label?: string | null;
  metadata?: Record<string, unknown> | null;
  storageKind: string;
  storagePath: string;
  createdAt?: string;
};

export type ApiBuildMetadata = ApiBuild & {
  version?: {
    id: string;
    version: string;
    app?: { id: string; name: string; identifier: string };
  };
  targets?: ApiTarget[];
  artifacts?: ApiArtifact[];
  artifactsByKind?: Record<string, ApiArtifact[]>;
  signing?: { teamId?: string | null; issuer?: string | null; subject?: string | null };
};

export type ApiTag = {
  id: string;
  name: string;
  usageCount?: number;
};

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatBytes = (bytes?: number | null) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

export type ApiBuildIcon = {
  targetId: string;
  bundleId: string;
  platform: string;
  role: string;
  iconBitmap?: {
    width?: number;
    height?: number;
    sizeBytes?: number;
    sourcePath?: string;
  };
  url: string;
  contentType: string;
  dataUrl?: string;
};

export type ApiBuildIconResponse = {
  buildId: string;
  items: ApiBuildIcon[];
};

export const pickPrimaryIcon = (icons?: ApiBuildIcon[] | null) => {
  if (!icons?.length) return null;
  return icons.find((item) => item.role === "app") ?? icons[0];
};

export const pickPrimaryTarget = (targets?: ApiTarget[] | null) => {
  if (!targets?.length) return null;
  return targets.find((target) => target.role === "app") ?? targets[0];
};

export type ApiBuildEvent = {
  id: string;
  buildId: string;
  teamId: string;
  kind: string;
  createdAt: string;
  ip?: string | null;
  userAgent?: string | null;
  build?: {
    id: string;
    buildNumber?: string | null;
    displayName?: string | null;
    version?: {
      id: string;
      version?: string | null;
      app?: { id: string; name?: string | null; identifier?: string | null } | null;
    } | null;
  } | null;
  user?: {
    id: string;
    username?: string | null;
    email?: string | null;
    fullName?: string | null;
  } | null;
};

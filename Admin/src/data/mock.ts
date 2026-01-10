export type Metric = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
};

export type AppSummary = {
  id: string;
  name: string;
  platform: "iOS" | "Android";
  version: string;
  build: number;
  status: "live" | "review" | "paused";
  updatedAt: string;
  team: string;
};

export type BuildJob = {
  id: string;
  name: string;
  branch: string;
  status: "queued" | "running" | "failed" | "success";
  startedAt: string;
  owner: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tag: string;
};

export type PipelineStage = {
  id: string;
  label: string;
  status: "healthy" | "warning" | "critical";
  notes: string;
};

export type PipelineAlert = {
  id: string;
  title: string;
  detail: string;
  status: "healthy" | "warning" | "critical";
  owner: string;
  time: string;
};

export type StorageBucket = {
  id: string;
  label: string;
  used: number;
  total: number;
};

export type SecurityPolicy = {
  id: string;
  title: string;
  owner: string;
  lastReview: string;
  status: "healthy" | "warning" | "critical";
};

export type SecurityAudit = {
  id: string;
  title: string;
  owner: string;
  time: string;
  status: "healthy" | "warning" | "critical";
};

export type SettingsProfile = {
  workspaceName: string;
  releaseDomain: string;
  approvalWindow: "24" | "48" | "72";
  alertEmail: string;
  autoPromote: boolean;
  policyDigest: boolean;
  rotationReminders: boolean;
};

export const metrics: Metric[] = [
  {
    label: "Active apps",
    value: "42",
    delta: "+6.4%",
    trend: "up",
  },
  {
    label: "Pending reviews",
    value: "9",
    delta: "-2",
    trend: "down",
  },
  {
    label: "Build success",
    value: "93.4%",
    delta: "+1.2%",
    trend: "up",
  },
  {
    label: "Policy issues",
    value: "3",
    delta: "0",
    trend: "flat",
  },
];

export const apps: AppSummary[] = [
  {
    id: "app-1",
    name: "Atlas Field",
    platform: "iOS",
    version: "4.2.1",
    build: 842,
    status: "live",
    updatedAt: "2 hours ago",
    team: "Northstar Ops",
  },
  {
    id: "app-2",
    name: "Pulse Monitor",
    platform: "Android",
    version: "3.8.0",
    build: 513,
    status: "review",
    updatedAt: "Yesterday",
    team: "Clinical Tools",
  },
  {
    id: "app-3",
    name: "Courier Flow",
    platform: "Android",
    version: "2.6.5",
    build: 277,
    status: "live",
    updatedAt: "3 days ago",
    team: "Delivery Systems",
  },
  {
    id: "app-4",
    name: "Summit POS",
    platform: "iOS",
    version: "6.1.0",
    build: 910,
    status: "paused",
    updatedAt: "Last week",
    team: "Retail Edge",
  },
  {
    id: "app-5",
    name: "Transit Hub",
    platform: "iOS",
    version: "1.9.3",
    build: 164,
    status: "review",
    updatedAt: "2 weeks ago",
    team: "Mobility Lab",
  },
];

export const buildQueue: BuildJob[] = [
  {
    id: "job-1",
    name: "Atlas Field",
    branch: "release/4.2.1",
    status: "running",
    startedAt: "12 min ago",
    owner: "Maya Singh",
  },
  {
    id: "job-2",
    name: "Pulse Monitor",
    branch: "hotfix/login-gate",
    status: "queued",
    startedAt: "Queued",
    owner: "Rafael Vega",
  },
  {
    id: "job-3",
    name: "Courier Flow",
    branch: "main",
    status: "success",
    startedAt: "38 min ago",
    owner: "Dina Park",
  },
  {
    id: "job-4",
    name: "Summit POS",
    branch: "release/6.1.0",
    status: "failed",
    startedAt: "1 hr ago",
    owner: "Liam Carter",
  },
];

export const activity: ActivityItem[] = [
  {
    id: "activity-1",
    title: "Certificate rotation scheduled",
    detail: "iOS signing keys for Atlas Field",
    time: "11 min ago",
    tag: "Security",
  },
  {
    id: "activity-2",
    title: "Release notes approved",
    detail: "Pulse Monitor 3.8.0",
    time: "45 min ago",
    tag: "Review",
  },
  {
    id: "activity-3",
    title: "Build artifact promoted",
    detail: "Courier Flow build 277",
    time: "2 hours ago",
    tag: "Build",
  },
  {
    id: "activity-4",
    title: "Policy exception opened",
    detail: "Summit POS access scope",
    time: "Yesterday",
    tag: "Compliance",
  },
];

export const pipelineStages: PipelineStage[] = [
  {
    id: "stage-1",
    label: "Ingest",
    status: "healthy",
    notes: "97% success",
  },
  {
    id: "stage-2",
    label: "Signing",
    status: "warning",
    notes: "Queue depth 12",
  },
  {
    id: "stage-3",
    label: "Distribution",
    status: "healthy",
    notes: "Latency 1.2s",
  },
  {
    id: "stage-4",
    label: "Monitoring",
    status: "critical",
    notes: "Alert storm",
  },
];

export const pipelineAlerts: PipelineAlert[] = [
  {
    id: "alert-1",
    title: "Signing queue threshold reached",
    detail: "Signing backlog exceeded 15 jobs in the last hour.",
    status: "warning",
    owner: "Release Ops",
    time: "18 min ago",
  },
  {
    id: "alert-2",
    title: "Distribution retries spiking",
    detail: "Delivery retry rate crossed 4.2% on EU region.",
    status: "critical",
    owner: "Infra Team",
    time: "42 min ago",
  },
  {
    id: "alert-3",
    title: "Monitoring lag detected",
    detail: "Events arriving 6 minutes late from Android clients.",
    status: "warning",
    owner: "Telemetry",
    time: "2 hours ago",
  },
];

export const storageBuckets: StorageBucket[] = [
  {
    id: "bucket-1",
    label: "Artifacts",
    used: 68,
    total: 100,
  },
  {
    id: "bucket-2",
    label: "Crash logs",
    used: 42,
    total: 100,
  },
  {
    id: "bucket-3",
    label: "Symbols",
    used: 81,
    total: 100,
  },
];

export const securityPolicies: SecurityPolicy[] = [
  {
    id: "policy-1",
    title: "Certificate rotation",
    owner: "Security",
    lastReview: "5 days ago",
    status: "healthy",
  },
  {
    id: "policy-2",
    title: "Access scope enforcement",
    owner: "Compliance",
    lastReview: "2 weeks ago",
    status: "warning",
  },
  {
    id: "policy-3",
    title: "Mobile device attestation",
    owner: "Platform",
    lastReview: "Yesterday",
    status: "healthy",
  },
  {
    id: "policy-4",
    title: "Signing key escrow",
    owner: "Security",
    lastReview: "3 months ago",
    status: "critical",
  },
];

export const securityAudits: SecurityAudit[] = [
  {
    id: "audit-1",
    title: "Retail Edge access review",
    owner: "Tara Martinez",
    time: "Due in 3 days",
    status: "warning",
  },
  {
    id: "audit-2",
    title: "Clinical Tools key rotation",
    owner: "Alex Chen",
    time: "Due tomorrow",
    status: "critical",
  },
  {
    id: "audit-3",
    title: "Delivery Systems approval audit",
    owner: "Jordan Lee",
    time: "Due in 1 week",
    status: "healthy",
  },
];

export const settingsProfile: SettingsProfile = {
  workspaceName: "Einstore Release Ops",
  releaseDomain: "releases.einstore.dev",
  approvalWindow: "48",
  alertEmail: "ops@einstore.dev",
  autoPromote: true,
  policyDigest: true,
  rotationReminders: false,
};

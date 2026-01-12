import AppAvatar from "../components/AppAvatar";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import StatusPill from "../components/StatusPill";
import {
  formatBytes,
  formatDateTime,
  pickPrimaryTarget,
  type ApiArtifact,
  type ApiBuildMetadata,
} from "../lib/apps";
import { infoPlistKeyDescriptionMap } from "../data/infoPlistKeys";
import { androidManifestKeyDescriptionMap } from "../data/androidManifestKeys";

const metadataDescriptionMap = { ...infoPlistKeyDescriptionMap, ...androidManifestKeyDescriptionMap };

type BuildDetailPageProps = {
  build: ApiBuildMetadata | null;
  iconUrl?: string | null;
  isLoading: boolean;
  error?: string | null;
  onInstall?: (buildId: string) => void;
  onDownload?: (buildId: string) => void;
};

const formatKind = (kind: string) => kind.replace(/_/g, " ");

const renderMetadataRows = (metadata: unknown) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const entries = Object.entries(metadata as Record<string, unknown>);
  if (!entries.length) return null;
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      {entries.map(([key, value], index) => {
        const isEven = index % 2 === 0;
        const description = metadataDescriptionMap[key];
        return (
          <div
            key={key}
            className={`grid gap-2 px-3 py-2 text-sm ${
              isEven ? "bg-slate-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{key}</span>
              {description ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>
              ) : null}
            </div>
            <div className="break-all font-mono text-xs text-slate-700 dark:text-slate-300">
              {typeof value === "string" || typeof value === "number"
                ? String(value)
                : JSON.stringify(value, null, 2)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BuildDetailPage = ({ build, iconUrl, isLoading, error, onInstall, onDownload }: BuildDetailPageProps) => {
  const primaryTarget = pickPrimaryTarget(build?.targets);
  const appName = build?.version?.app?.name ?? build?.displayName ?? "—";
  const identifier = build?.version?.app?.identifier ?? primaryTarget?.bundleId ?? "—";
  const platform = primaryTarget?.platform ?? "—";
  const version = build?.version?.version ?? "—";
  const buildNumber = build?.buildNumber ?? "—";
  const size = formatBytes(build?.sizeBytes);
  const created = formatDateTime(build?.createdAt);
  const signingIssuer = build?.signing?.issuer ?? "—";
  const signingSubject = build?.signing?.subject ?? "—";
  const artifactsByKind = build?.artifactsByKind ?? {};
  const artifactGroups = Object.entries(artifactsByKind).map(([kind, items]) => {
    const unique = (items ?? []).filter(Boolean).reduce<ApiArtifact[]>((acc, current) => {
      const key = `${current.kind}-${current.label ?? ""}-${current.storagePath}`;
      if (!acc.find((item) => `${item.kind}-${item.label ?? ""}-${item.storagePath}` === key)) {
        acc.push(current);
      }
      return acc;
    }, []);
    return [kind, unique] as const;
  });

  return (
    <div className="space-y-6">
      {error ? (
        <Panel className="border border-rose-200 bg-rose-50 text-rose-700">
          {error}
        </Panel>
      ) : null}
      {isLoading ? <Panel>Loading build…</Panel> : null}
      {!isLoading && !build ? <Panel>No build details found.</Panel> : null}

      {build ? (
        <>
          <div className="grid grid-cols-12 gap-6">
            <Panel className="col-span-12 md:col-span-4 space-y-4 text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center">
                <AppAvatar name={appName} iconUrl={iconUrl} platform={platform} size="lg" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {appName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{identifier}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <StatusPill status="running" label={`Platform: ${platform}`} />
                <StatusPill status="running" label={`Version ${version}`} />
                <StatusPill status="running" label={`Build ${buildNumber}`} />
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  className="h-10 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500"
                  onClick={() => build?.id && onInstall?.(build.id)}
                  disabled={!build}
                >
                  Install
                </button>
                <button
                  type="button"
                  className="h-10 rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => build?.id && onDownload?.(build.id)}
                  disabled={!build}
                >
                  Download
                </button>
              </div>
            </Panel>

            <Panel className="col-span-12 md:col-span-8 space-y-4">
              <SectionHeader title="Build information" />
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    App
                  </dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">{appName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Identifier
                  </dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">{identifier}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Version
                  </dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">{version}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Build number
                  </dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">{buildNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Storage
                  </dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">
                    {build.storageKind.toUpperCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Size
                  </dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">{size}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">{created}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Build ID
                  </dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">{build.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Signing issuer
                  </dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">
                    {signingIssuer || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Signing subject
                  </dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">
                    {signingSubject || "—"}
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <Panel className="col-span-12 md:col-span-6 space-y-4">
              <SectionHeader title="Targets" />
              {!build.targets?.length ? (
                <p className="text-sm text-slate-500">No targets found for this build.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  {build.targets.map((target, index) => {
                    const isEven = index % 2 === 0;
                    return (
                      <div
                        key={target.id}
                        className={`grid gap-2 px-4 py-3 text-sm ${
                          isEven ? "bg-slate-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {target.bundleId}
                            </p>
                            <p className="text-xs text-slate-500">
                              {target.platform} • {target.role}
                              {target.minOsVersion ? ` • Min OS ${target.minOsVersion}` : ""}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            Target
                          </span>
                        </div>
                        {renderMetadataRows(target.metadata)}
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel className="col-span-12 md:col-span-6 space-y-4">
              <SectionHeader title="Artifacts & entitlements" />
              {!artifactGroups.length ? (
                <p className="text-sm text-slate-500">No artifacts available.</p>
              ) : (
                <div className="space-y-4">
                  {artifactGroups.map(([kind, items]) => {
                    if (!items.length) return null;
                    return (
                      <div key={kind} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {formatKind(kind)}
                        </p>
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                          {items.map((item, index) => {
                            const isEven = index % 2 === 0;
                            return (
                              <div
                                key={item.id}
                                className={`grid gap-2 px-4 py-3 text-sm ${
                                  isEven
                                    ? "bg-slate-50 dark:bg-slate-800"
                                    : "bg-white dark:bg-slate-900"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                      {item.label || formatKind(item.kind)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {item.storageKind?.toUpperCase?.() ?? "—"} • {item.storagePath}
                                    </p>
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {item.createdAt ? formatDateTime(item.createdAt) : "—"}
                                  </p>
                                </div>
                                {renderMetadataRows(item.metadata)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default BuildDetailPage;

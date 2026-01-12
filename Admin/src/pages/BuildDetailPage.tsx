import { useEffect, useState } from "react";
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
  type ApiTag,
} from "../lib/apps";
import { infoPlistKeyDescriptionMap } from "../data/infoPlistKeys";
import { androidManifestKeyDescriptionMap } from "../data/androidManifestKeys";
import TagInput from "../components/TagInput";

const metadataDescriptionMap = { ...infoPlistKeyDescriptionMap, ...androidManifestKeyDescriptionMap };

type BuildDetailPageProps = {
  build: ApiBuildMetadata | null;
  iconUrl?: string | null;
  isLoading: boolean;
  error?: string | null;
  onInstall?: (buildId: string) => void;
  onDownload?: (buildId: string) => void;
  tags?: ApiTag[];
  availableTags?: ApiTag[];
  onChangeTags?: (tags: string[]) => void;
};

const formatKind = (kind: string) => kind.replace(/_/g, " ");

const renderMetadataRows = (metadata: unknown) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const entries = Object.entries(metadata as Record<string, unknown>);
  if (!entries.length) return null;
  const formatValue = (value: unknown): string => {
    if (value == null) return "—";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => formatValue(item)).join(", ");
    }
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join("; ");
  };

  const toSegments = (value: unknown): string[] => {
    const text = formatValue(value);
    if (text.includes(";")) {
      return text.split(";").map((item) => item.trim()).filter(Boolean);
    }
    if (text.includes(",")) {
      return text.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return [text];
  };

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      {entries.map(([key, value], index) => {
        const isEven = index % 2 === 0;
        const description = metadataDescriptionMap[key];
        const segments = toSegments(value);
        return (
          <div
            key={key}
            className={`grid grid-cols-[1fr_2fr] gap-3 px-3 py-3 text-sm ${
              isEven ? "bg-slate-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900"
            }`}
          >
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{key}</p>
              {description ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
              ) : null}
            </div>
            <div className="space-y-1 break-words text-xs text-slate-700 dark:text-slate-300">
              {segments.map((segment, segmentIndex) => (
                <div
                  key={`${key}-${segmentIndex}`}
                  className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-700/60"
                >
                  {segment || "—"}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BuildDetailPage = ({
  build,
  iconUrl,
  isLoading,
  error,
  onInstall,
  onDownload,
  tags = [],
  availableTags = [],
  onChangeTags,
}: BuildDetailPageProps) => {
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

  const [tagDraft, setTagDraft] = useState<string[]>(tags.map((tag) => tag.name));

  useEffect(() => {
    setTagDraft(tags.map((tag) => tag.name));
  }, [tags]);

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

            <Panel className="col-span-12 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <SectionHeader
                  title="Tags"
                  subtitle="Tags help you find builds quickly. Add multiple tags; changes save automatically."
                />
                <button
                  type="button"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => {
                    if (!tagDraft.includes("preview")) {
                      const next = [...tagDraft, "preview"];
                      setTagDraft(next);
                      onChangeTags?.(next);
                    }
                  }}
                >
                  Make preview
                </button>
              </div>
              <TagInput
                value={tagDraft}
                onChange={(next) => {
                  setTagDraft(next);
                  onChangeTags?.(next);
                }}
                suggestions={availableTags.map((tag) => tag.name)}
                placeholder="Add a tag (e.g. release, beta, hotfix)"
              />
              <details className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/60">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Tag palette
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { name: "bug", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200" },
                    { name: "ok", className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200" },
                    { name: "preview", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200" },
                    { name: "tested", className: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200" },
                    { name: "needs testing", className: "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-100" },
                  ].map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${item.className}`}
                      onClick={() => {
                        const next = Array.from(new Set([...tagDraft, item.name]));
                        setTagDraft(next);
                        onChangeTags?.(next);
                      }}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </details>
              {tags.length ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold uppercase tracking-wide">Saved</span>
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No tags yet. Add some to make search easier.
                </p>
              )}
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

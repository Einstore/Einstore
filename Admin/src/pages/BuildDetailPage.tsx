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
  type BuildMetadataUpdateInput,
  type ApiTag,
  type ApiBuildEvent,
} from "../lib/apps";
import { infoPlistKeyDescriptionMap } from "../data/infoPlistKeys";
import { androidManifestKeyDescriptionMap } from "../data/androidManifestKeys";
import TagInput from "../components/TagInput";
import Pagination from "../components/Pagination";
import type { PaginationMeta } from "../lib/pagination";
import CommentsPanel from "../components/CommentsPanel";
import type { ApiComment } from "../lib/comments";
import { canInstallForPlatforms } from "../lib/platform";

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
  onChangeTags?: (tags: string[]) => Promise<void> | void;
  downloads?: ApiBuildEvent[];
  downloadMeta?: PaginationMeta;
  onDownloadPageChange?: (page: number) => void;
  onUpdateMetadata?: (updates: BuildMetadataUpdateInput) => Promise<ApiBuildMetadata | null | void>;
  comments?: ApiComment[];
  onSubmitComment?: (text: string) => Promise<void>;
  isCommentsLoading?: boolean;
  isCommentSubmitting?: boolean;
  commentsError?: string | null;
  currentUserId?: string | null;
};

const formatKind = (kind: string) => kind.replace(/_/g, " ");

const readCookie = (key: string) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${encodeURIComponent(key)}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] ?? "");
};

const writeCookie = (key: string, value: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=31536000; SameSite=Lax`;
};

const resolveDeviceLabel = (userAgent?: string | null) => {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return "Unknown device";
  if (ua.includes("iphone") || ua.includes("ipod")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("android")) return ua.includes("mobile") ? "Android" : "Android tablet";
  if (ua.includes("macintosh") || ua.includes("mac os")) return "Mac";
  if (ua.includes("windows")) return "PC";
  if (ua.includes("linux")) return "PC";
  return "Unknown device";
};

const tagPaletteClasses: Record<string, string> = {
  bug: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  ok: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  preview: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  tested: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  "needs testing": "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-100",
};

const tagPaletteOrder = ["bug", "ok", "preview", "tested", "needs testing"];

const getTagClassName = (tag: string) =>
  tagPaletteClasses[tag.toLowerCase()] ??
  "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100";

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
  downloads = [],
  downloadMeta,
  onDownloadPageChange,
  onUpdateMetadata,
  comments = [],
  onSubmitComment,
  isCommentsLoading = false,
  isCommentSubmitting = false,
  commentsError = null,
  currentUserId,
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
  const canInstall = canInstallForPlatforms(build?.targets?.map((target) => target.platform) ?? []);
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
  const infoObject =
    build?.info && typeof build.info === "object" && !Array.isArray(build.info) ? build.info : null;

  const [tagDraft, setTagDraft] = useState<string[]>(tags.map((tag) => tag.name));
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    gitCommit: "",
    prUrl: "",
    changeLog: "",
    notes: "",
    infoText: "",
  });
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isTargetsOpen, setIsTargetsOpen] = useState(false);
  const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);
  const [isTagPaletteOpen, setIsTagPaletteOpen] = useState(false);
  const [tagAlert, setTagAlert] = useState<string | null>(null);

  const cookiePrefix = build?.id ? `build-detail:${build.id}:` : "build-detail:default:";

  useEffect(() => {
    const downloads = readCookie(`${cookiePrefix}downloads`);
    const targets = readCookie(`${cookiePrefix}targets`);
    const artifacts = readCookie(`${cookiePrefix}artifacts`);
    const palette = readCookie(`${cookiePrefix}tagPalette`);
    setIsDownloadsOpen(downloads === "1");
    setIsTargetsOpen(targets === "1");
    setIsArtifactsOpen(artifacts === "1");
    setIsTagPaletteOpen(palette === "1");
  }, [cookiePrefix]);

  useEffect(() => {
    setTagDraft(tags.map((tag) => tag.name));
  }, [tags]);

  useEffect(() => {
    if (!isEditOpen) return;
    setEditForm({
      gitCommit: build?.gitCommit ?? "",
      prUrl: build?.prUrl ?? "",
      changeLog: build?.changeLog ?? "",
      notes: build?.notes ?? "",
      infoText:
        build?.info && typeof build.info === "object" && !Array.isArray(build.info)
          ? JSON.stringify(build.info, null, 2)
          : "",
    });
    setEditError("");
  }, [isEditOpen, build]);

  return (
    <div className="space-y-6">
      {tagAlert ? (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 transform rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg dark:bg-slate-800">
          {tagAlert}
        </div>
      ) : null}
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
                {canInstall ? (
                  <button
                    type="button"
                    className="h-10 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500"
                    onClick={() => build?.id && onInstall?.(build.id)}
                    disabled={!build}
                  >
                    Install
                  </button>
                ) : null}
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
                  title="Release details"
                  subtitle="Optional metadata that helps connect builds back to code and release notes."
                />
                {onUpdateMetadata ? (
                  <button
                    type="button"
                    className="h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => setIsEditOpen(true)}
                  >
                    Edit details
                  </button>
                ) : null}
              </div>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Git commit
                  </dt>
                  <dd className="mt-1 break-all text-sm text-slate-900 dark:text-slate-100">
                    {build?.gitCommit ? <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{build.gitCommit}</code> : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    PR link
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {build?.prUrl ? (
                      <a
                        href={build.prUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline transition-colors hover:text-indigo-500 dark:text-indigo-300"
                      >
                        {build.prUrl}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Change log
                  </p>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {build?.changeLog ? (
                      <p className="whitespace-pre-wrap break-words text-sm">{build.changeLog}</p>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">Not provided.</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes
                  </p>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {build?.notes ? (
                      <p className="whitespace-pre-wrap break-words text-sm">{build.notes}</p>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">Not provided.</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Info (JSON)</p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  {infoObject ? (
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(infoObject, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">No additional info.</span>
                  )}
                </div>
              </div>
            </Panel>

            <div className="col-span-12 grid grid-cols-12 gap-6 md:items-start">
              <div className="col-span-12 space-y-6 md:col-span-6">
                <Panel className="space-y-4">
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
                      getTagClassName={getTagClassName}
                      onChange={async (next) => {
                        setTagDraft(next);
                        try {
                        await onChangeTags?.(next);
                        setTagAlert("Tags saved");
                        setTimeout(() => setTagAlert(null), 2000);
                      } catch {
                        setTagAlert("Could not save tags");
                        setTimeout(() => setTagAlert(null), 2000);
                      }
                    }}
                    suggestions={availableTags.map((tag) => tag.name)}
                    placeholder="Add a tag (e.g. release, beta, hotfix)"
                  />
                  <details
                    open={isTagPaletteOpen}
                    onToggle={(event) => {
                      const open = event.currentTarget.open;
                      setIsTagPaletteOpen(open);
                      writeCookie(`${cookiePrefix}tagPalette`, open ? "1" : "0");
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Tag palette
                    </summary>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tagPaletteOrder.map((name) => (
                        <button
                          key={name}
                          type="button"
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tagPaletteClasses[name]}`}
                          onClick={() => {
                            const next = Array.from(new Set([...tagDraft, name]));
                            setTagDraft(next);
                            onChangeTags?.(next);
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </details>
                </Panel>

                <CommentsPanel
                  comments={comments}
                  currentUserId={currentUserId}
                  onSubmit={onSubmitComment}
                  isSubmitting={isCommentSubmitting}
                  isLoading={isCommentsLoading}
                  error={commentsError || undefined}
                />
              </div>

              <div className="col-span-12 space-y-6 md:col-span-6">
                <Panel className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="Download history" subtitle="Newest first" />
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300"
                      onClick={() => {
                        setIsDownloadsOpen((current) => {
                          const next = !current;
                          writeCookie(`${cookiePrefix}downloads`, next ? "1" : "0");
                          return next;
                        });
                      }}
                    >
                      {isDownloadsOpen ? "Collapse" : "Expand"}
                    </button>
                  </div>
                  {isDownloadsOpen ? (
                    <>
                      {!downloads.length ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No downloads recorded for this build yet.
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                          {downloads.map((event, index) => {
                            const isEven = index % 2 === 0;
                            const user =
                              event.user?.fullName ||
                              event.user?.username ||
                              event.user?.email ||
                              "Unknown user";
                            const deviceLabel = resolveDeviceLabel(event.userAgent);
                            const actionLabel =
                              event.kind === "install" ? "Install" : "Download";
                            return (
                              <div
                                key={event.id}
                                className={`flex items-center justify-between px-4 py-3 text-sm ${
                                  isEven ? "bg-slate-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900"
                                }`}
                              >
                                <div className="space-y-1">
                                  <p className="font-semibold text-slate-900 dark:text-slate-100">{user}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {actionLabel} • {deviceLabel}
                                  </p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatDateTime(event.createdAt)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {downloadMeta && downloadMeta.total > downloadMeta.perPage ? (
                        <Pagination
                          page={downloadMeta.page}
                          perPage={downloadMeta.perPage}
                          totalPages={downloadMeta.totalPages}
                          onPageChange={onDownloadPageChange}
                        />
                      ) : null}
                    </>
                  ) : null}
                </Panel>

                <Panel className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="Targets" />
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300"
                      onClick={() => {
                        setIsTargetsOpen((current) => {
                          const next = !current;
                          writeCookie(`${cookiePrefix}targets`, next ? "1" : "0");
                          return next;
                        });
                      }}
                    >
                      {isTargetsOpen ? "Collapse" : "Expand"}
                    </button>
                  </div>
                  {isTargetsOpen ? (
                    !build.targets?.length ? (
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
                    )
                  ) : null}
                </Panel>

                <Panel className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="Artifacts & entitlements" />
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300"
                      onClick={() => {
                        setIsArtifactsOpen((current) => {
                          const next = !current;
                          writeCookie(`${cookiePrefix}artifacts`, next ? "1" : "0");
                          return next;
                        });
                      }}
                    >
                      {isArtifactsOpen ? "Collapse" : "Expand"}
                    </button>
                  </div>
                  {isArtifactsOpen ? (
                    !artifactGroups.length ? (
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
                    )
                  ) : null}
                </Panel>
              </div>
            </div>
          </div>

        </>
      ) : null}

      {isEditOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Panel className="w-full max-w-3xl space-y-5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Edit build details
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Link this build back to source control and release notes. Empty fields will be cleared.
                </p>
              </div>
              <button
                type="button"
                className="text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setIsEditOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Git commit
                </span>
                <input
                  type="text"
                  value={editForm.gitCommit}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, gitCommit: event.target.value }))
                  }
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="e.g. 9fceb02"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  PR link
                </span>
                <input
                  type="url"
                  value={editForm.prUrl}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, prUrl: event.target.value }))
                  }
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="https://github.com/org/repo/pull/123"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Change log
                </span>
                <textarea
                  value={editForm.changeLog}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, changeLog: event.target.value }))
                  }
                  className="min-h-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="What changed in this build?"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </span>
                <textarea
                  value={editForm.notes}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  className="min-h-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Tester notes, install instructions, etc."
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Info (JSON)
              </span>
              <textarea
                value={editForm.infoText}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, infoText: event.target.value }))
                }
                className="min-h-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder='{"qaOwner":"Alex","jira":"MOBILE-123"}'
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provide a JSON object for any extra metadata (e.g., QA owner, links, environment flags).
              </p>
            </label>

            {editError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-900/30 dark:text-rose-200">
                {editError}
              </p>
            ) : null}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditError("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
                disabled={isSavingEdit}
                onClick={async () => {
                  if (!onUpdateMetadata || !build?.id) return;
                  setIsSavingEdit(true);
                  setEditError("");
                  try {
                    let parsedInfo: Record<string, unknown> | null | undefined = undefined;
                    const infoText = editForm.infoText.trim();
                    if (infoText) {
                      const parsed = JSON.parse(infoText);
                      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                        throw new Error("Info must be a JSON object.");
                      }
                      parsedInfo = parsed as Record<string, unknown>;
                    } else {
                      parsedInfo = null;
                    }
                    const payload: BuildMetadataUpdateInput = {
                      gitCommit: editForm.gitCommit.trim() || null,
                      prUrl: editForm.prUrl.trim() || null,
                      changeLog: editForm.changeLog.trim() || null,
                      notes: editForm.notes.trim() || null,
                      info: parsedInfo,
                    };
                    await onUpdateMetadata(payload);
                    setIsEditOpen(false);
                  } catch (err) {
                    setEditError(err instanceof Error ? err.message : "Unable to save changes.");
                  } finally {
                    setIsSavingEdit(false);
                  }
                }}
              >
                Save changes
              </button>
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
};

export default BuildDetailPage;

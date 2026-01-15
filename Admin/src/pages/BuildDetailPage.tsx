import { useState } from "react";
import Panel from "../components/Panel";
import CommentsPanel from "../components/CommentsPanel";
import BuildHeaderCard from "../components/buildDetail/BuildHeaderCard";
import BuildInfoPanel from "../components/buildDetail/BuildInfoPanel";
import ReleaseDetailsPanel, {
  type ReleaseDetailRow,
} from "../components/buildDetail/ReleaseDetailsPanel";
import TagsPanel from "../components/buildDetail/TagsPanel";
import DownloadsPanel from "../components/buildDetail/DownloadsPanel";
import TargetsPanel from "../components/buildDetail/TargetsPanel";
import ArtifactsPanel from "../components/buildDetail/ArtifactsPanel";
import EditBuildModal from "../components/buildDetail/EditBuildModal";
import {
  formatBytes,
  formatDateTime,
  pickPrimaryTarget,
  type ApiBuildMetadata,
  type BuildMetadataUpdateInput,
  type ApiTag,
  type ApiBuildEvent,
} from "../lib/apps";
import type { PaginationMeta } from "../lib/pagination";
import type { ApiComment } from "../lib/comments";
import { canInstallForPlatforms } from "../lib/platform";
import { useI18n } from "../lib/i18n";

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
  const { t } = useI18n();
  const primaryTarget = pickPrimaryTarget(build?.targets);
  const appName = build?.version?.app?.name ?? build?.displayName ?? t("common.emptyDash", "—");
  const identifier =
    build?.version?.app?.identifier ?? primaryTarget?.bundleId ?? t("common.emptyDash", "—");
  const platform = primaryTarget?.platform ?? t("common.emptyDash", "—");
  const version = build?.version?.version ?? t("common.emptyDash", "—");
  const buildNumber = build?.buildNumber ?? t("common.emptyDash", "—");
  const size = formatBytes(build?.sizeBytes);
  const created = formatDateTime(build?.createdAt);
  const signingIssuer = build?.signing?.issuer ?? t("common.emptyDash", "—");
  const signingSubject = build?.signing?.subject ?? t("common.emptyDash", "—");
  const canInstall = canInstallForPlatforms(build?.targets?.map((target) => target.platform) ?? []);
  const cookiePrefix = build?.id ? `build-detail:${build.id}:` : "build-detail:default:";
  const infoObject =
    build?.info && typeof build.info === "object" && !Array.isArray(build.info) ? build.info : null;

  const releaseDetailsRows: ReleaseDetailRow[] = [
    {
      label: t("build.release.gitCommit", "Git commit"),
      value: build?.gitCommit ?? null,
      type: "code",
    },
    { label: t("build.release.prLink", "PR link"), value: build?.prUrl ?? null, type: "link" },
    {
      label: t("build.release.changeLog", "Change log"),
      value: build?.changeLog ?? null,
      type: "text",
    },
    { label: t("build.release.notes", "Notes"), value: build?.notes ?? null, type: "text" },
    ...(infoObject
      ? Object.entries(infoObject).map(([key, value]) => ({
          label: key,
          value:
            typeof value === "string"
              ? value
              : typeof value === "number" || typeof value === "boolean"
              ? String(value)
              : JSON.stringify(value, null, 2),
          type: "info" as const,
        }))
      : []),
  ];

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tagAlert, setTagAlert] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {tagAlert ? (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 transform rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg dark:bg-slate-800">
          {tagAlert}
        </div>
      ) : null}
      {error ? <Panel className="border border-rose-200 bg-rose-50 text-rose-700">{error}</Panel> : null}
      {isLoading ? <Panel>{t("build.loading", "Loading build…")}</Panel> : null}
      {!isLoading && !build ? <Panel>{t("build.empty", "No build details found.")}</Panel> : null}

      {build ? (
        <>
          <div className="grid grid-cols-12 gap-6">
            <BuildHeaderCard
              appName={appName}
              identifier={identifier}
              platform={platform}
              version={version}
              buildNumber={buildNumber}
              iconUrl={iconUrl}
              buildId={build.id}
              canInstall={canInstall}
              onInstall={onInstall}
              onDownload={onDownload}
              t={t}
            />
            <BuildInfoPanel
              build={build}
              appName={appName}
              identifier={identifier}
              version={version}
              buildNumber={buildNumber}
              size={size}
              created={created}
              signingIssuer={signingIssuer}
              signingSubject={signingSubject}
              t={t}
            />
            <ReleaseDetailsPanel
              rows={releaseDetailsRows}
              onEdit={onUpdateMetadata ? () => setIsEditOpen(true) : undefined}
              t={t}
            />
            <div className="col-span-12 grid grid-cols-12 gap-6 md:items-start">
              <div className="col-span-12 space-y-6 md:col-span-6">
                <TagsPanel
                  tags={tags}
                  availableTags={availableTags}
                  onChangeTags={onChangeTags}
                  cookiePrefix={cookiePrefix}
                  onAlert={setTagAlert}
                  t={t}
                />
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
                <DownloadsPanel
                  downloads={downloads}
                  downloadMeta={downloadMeta}
                  onDownloadPageChange={onDownloadPageChange}
                  cookiePrefix={cookiePrefix}
                  t={t}
                />
                <TargetsPanel targets={build.targets} cookiePrefix={cookiePrefix} t={t} />
                <ArtifactsPanel
                  artifactsByKind={build.artifactsByKind}
                  cookiePrefix={cookiePrefix}
                  t={t}
                />
              </div>
            </div>
          </div>
        </>
      ) : null}

      <EditBuildModal
        isOpen={isEditOpen}
        build={build}
        onClose={() => setIsEditOpen(false)}
        onUpdateMetadata={onUpdateMetadata}
        t={t}
      />
    </div>
  );
};

export default BuildDetailPage;

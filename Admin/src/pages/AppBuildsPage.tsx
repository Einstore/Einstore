import { useState } from "react";
import ActionButton from "../components/ActionButton";
import AppAvatar from "../components/AppAvatar";
import PlatformIcon from "../components/PlatformIcon";
import BuildQueueList from "../components/BuildQueueList";
import ConfirmDialog from "../components/ConfirmDialog";
import Panel from "../components/Panel";
import Pagination from "../components/Pagination";
import SectionHeader from "../components/SectionHeader";
import StatusPill from "../components/StatusPill";
import type { ApiApp, ApiBuild } from "../lib/apps";
import { formatDateTime } from "../lib/apps";
import type { PaginationMeta } from "../lib/pagination";
import { useI18n } from "../lib/i18n";

type AppBuildsPageProps = {
  app: ApiApp | null;
  builds: ApiBuild[];
  appIcon?: string | null;
  buildIcons?: Record<string, string>;
  buildPlatforms?: Record<string, string>;
  onSelectBuild?: (id: string) => void;
  onInstallBuild?: (id: string) => void;
  onDownloadBuild?: (id: string) => void;
  onDeleteBuilds?: () => Promise<boolean>;
  isDeletingBuilds?: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

const AppBuildsPage = ({
  app,
  builds,
  appIcon,
  buildIcons,
  buildPlatforms,
  onSelectBuild,
  onInstallBuild,
  onDownloadBuild,
  onDeleteBuilds,
  isDeletingBuilds,
  pagination,
  onPageChange,
  onPerPageChange,
}: AppBuildsPageProps) => {
  const { t } = useI18n();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const latestBuild = builds[0] ?? null;
  const lastUploaded = latestBuild ? formatDateTime(latestBuild.createdAt) : t("common.emptyDash", "—");
  const totalBuilds = pagination.total ?? builds.length;
  const hasBuilds = totalBuilds > 0;

  const handleDeleteConfirm = async () => {
    if (!onDeleteBuilds || isDeletingBuilds) {
      return;
    }
    const ok = await onDeleteBuilds();
    if (ok) {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <Panel className="flex h-full items-center gap-4">
            <div className="flex items-center gap-4">
              <AppAvatar name={app?.name ?? latestBuild?.displayName} iconUrl={appIcon} size="lg" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {app?.identifier ?? t("app.fallback", "App")}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  <PlatformIcon platform={app?.platform} className="h-4 w-4 text-slate-400 dark:text-slate-300" />
                  {app?.name ?? latestBuild?.displayName ?? t("app.fallback", "App")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("app.lastUploaded", "Last uploaded {date}", { date: lastUploaded })}
                </p>
              </div>
            </div>
          </Panel>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <Panel className="flex h-full items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("build.latest", "Latest build")}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {latestBuild ? latestBuild.displayName : t("common.emptyDash", "—")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("build.row.number", "Build #{number}", {
                  number: latestBuild?.buildNumber ?? t("common.emptyDash", "—"),
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status="running" label={t("builds.app.label", "App builds")} />
              {latestBuild ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    onClick={() => onInstallBuild?.(latestBuild.id)}
                  >
                    {t("build.action.install", "Install")}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => onDownloadBuild?.(latestBuild.id)}
                  >
                    {t("build.action.download", "Download")}
                  </button>
                </div>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>

      <SectionHeader
        title={t("common.builds", "Builds")}
        actions={
          <ActionButton
            label={t("common.delete", "Delete")}
            variant="danger"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={!hasBuilds || !onDeleteBuilds || isDeletingBuilds}
          />
        }
      />
      <BuildQueueList
        jobs={builds}
        icons={buildIcons}
        platforms={buildPlatforms}
        onSelect={onSelectBuild}
        onInstall={onInstallBuild}
        onDownload={onDownloadBuild}
      />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        perPage={pagination.perPage}
        total={pagination.total}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title={t("builds.deleteAll.title", "Delete all builds?")}
        description={t(
          "builds.deleteAll.description",
          "This will remove {count} builds for this app, along with comments and download tracking.",
          { count: totalBuilds }
        )}
        confirmLabel={t("common.delete", "Delete")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default AppBuildsPage;

import OverviewSection from "../sections/OverviewSection";
import ReleasesSection from "../sections/ReleasesSection";
import StorageSection from "../sections/StorageSection";
import BuildQueueSection from "../sections/BuildQueueSection";
import SplitLayout from "../components/SplitLayout";
import Panel from "../components/Panel";
import BuildQueueList from "../components/BuildQueueList";
import ActivityItemCard from "../components/ActivityItemCard";
import type { ActivityItem, AppSummary, BuildJob, Metric } from "../data/mock";
import type { StorageUsageUser } from "../types/usage";
import type { SearchBuildResult } from "../lib/search";

type OverviewPageProps = {
  metrics: Metric[];
  apps: AppSummary[];
  buildQueue: BuildJob[];
  storageUsage: StorageUsageUser[];
  storageTotalBytes: number;
  isStorageLoading?: boolean;
  showMetrics?: boolean;
  showStorage?: boolean;
  activity?: ActivityItem[];
  showActivity?: boolean;
  appsTotal?: number;
  buildsTotal?: number;
  previewBuilds?: SearchBuildResult[];
  appIconsByApp?: Record<string, string>;
  onInstallBuild?: (id: string) => void;
  onDownloadBuild?: (id: string) => void;
};

const OverviewPage = ({
  metrics,
  apps,
  buildQueue,
  storageUsage,
  storageTotalBytes,
  isStorageLoading = false,
  showMetrics = false,
  showStorage = false,
  activity = [],
  showActivity = false,
  appsTotal,
  buildsTotal,
  previewBuilds = [],
  appIconsByApp,
  onInstallBuild,
  onDownloadBuild,
}: OverviewPageProps) => {
  const appsCount = appsTotal ?? apps?.length ?? 0;
  const buildsCount = buildsTotal ?? buildQueue?.length ?? 0;
  const formatBytes = (value: number) => {
    if (!value) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const power = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
    const scaled = value / Math.pow(1024, power);
    return `${scaled.toFixed(scaled >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Panel className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Apps
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{appsCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total apps in this workspace</p>
        </Panel>
        <Panel className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Builds
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {buildsCount}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Recent builds listed below</p>
        </Panel>
        <Panel className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Placeholder
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {formatBytes(storageTotalBytes)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Storage used across this workspace
          </p>
        </Panel>
      </div>
      {showMetrics ? <OverviewSection metrics={metrics} /> : null}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Preview builds
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Builds tagged with “preview” (max 4)
          </p>
        </div>
        {previewBuilds.length ? (
          <BuildQueueList
            jobs={previewBuilds.slice(0, 4).map((build) => ({
              id: build.id,
              name: build.displayName || build.appName || "Preview build",
              buildNumber: build.buildNumber,
              createdAt: build.createdAt,
              appId: build.appId,
            }))}
            appIcons={appIconsByApp}
            onInstall={onInstallBuild}
            onDownload={onDownloadBuild}
          />
        ) : (
          <Panel>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No preview builds yet. Add the <strong>preview</strong> tag to any build to feature it here.
            </p>
          </Panel>
        )}
      </div>
      {showActivity ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Latest downloads & installs
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Newest install/download events (5)
            </p>
          </div>
          {activity.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activity.slice(0, 5).map((item) => (
                <ActivityItemCard key={item.id} {...item} />
              ))}
            </div>
          ) : (
            <Panel>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                No download activity yet. Once builds are downloaded or installed, the newest five
                events will appear here.
              </p>
            </Panel>
          )}
        </div>
      ) : null}
      <SplitLayout
        left={<ReleasesSection apps={apps} />}
        right={<BuildQueueSection jobs={buildQueue} />}
        leftClassName="col-span-12 xl:col-span-7"
        rightClassName="col-span-12 xl:col-span-5"
      />
      {showStorage ? (
        <StorageSection
          users={storageUsage}
          totalBytes={storageTotalBytes}
          isLoading={isStorageLoading}
        />
      ) : null}
    </div>
  );
};

export default OverviewPage;

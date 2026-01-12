import OverviewSection from "../sections/OverviewSection";
import ReleasesSection from "../sections/ReleasesSection";
import StorageSection from "../sections/StorageSection";
import BuildQueueSection from "../sections/BuildQueueSection";
import SplitLayout from "../components/SplitLayout";
import Panel from "../components/Panel";
import type { AppSummary, BuildJob, Metric } from "../data/mock";
import type { StorageUsageUser } from "../types/usage";

type OverviewPageProps = {
  metrics: Metric[];
  apps: AppSummary[];
  buildQueue: BuildJob[];
  storageUsage: StorageUsageUser[];
  storageTotalBytes: number;
  isStorageLoading?: boolean;
  showMetrics?: boolean;
  showStorage?: boolean;
  appsTotal?: number;
  buildsTotal?: number;
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
  appsTotal,
  buildsTotal,
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

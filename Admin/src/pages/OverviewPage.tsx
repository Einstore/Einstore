import { useMemo, useState } from "react";
import OverviewSection from "../sections/OverviewSection";
import StorageSection from "../sections/StorageSection";
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
  const [previewAppId, setPreviewAppId] = useState<string>("all");
  const [appSearch, setAppSearch] = useState("");
  const [isAppDropdownOpen, setIsAppDropdownOpen] = useState(false);

  const appsCount = appsTotal ?? apps?.length ?? 0;
  const buildsCount = buildsTotal ?? buildQueue?.length ?? 0;
  const formatBytes = (value: number) => {
    if (!value) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const power = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
    const scaled = value / Math.pow(1024, power);
    return `${scaled.toFixed(scaled >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
  };

  const appOptions = useMemo(
    () => [
      { id: "all", name: "All apps" },
      ...apps.map((app) => ({ id: app.id, name: app.name || app.identifier || "App" })),
    ],
    [apps]
  );

  const selectedAppLabel =
    appOptions.find((option) => option.id === previewAppId)?.name ?? "All apps";

  const filteredAppOptions = useMemo(
    () =>
      appOptions
        .filter((option) =>
          appSearch ? option.name.toLowerCase().includes(appSearch.toLowerCase()) : true
        )
        .slice(0, 8),
    [appOptions, appSearch]
  );

  const displayPreviewBuilds = useMemo(() => {
    if (!previewBuilds.length) return [];

    if (previewAppId === "all") {
      const seen = new Set<string>();
      const uniqueByApp = previewBuilds.filter((build) => {
        if (!build.appId) return false;
        if (seen.has(build.appId)) return false;
        seen.add(build.appId);
        return true;
      });
      return uniqueByApp.slice(0, 4);
    }

    const byApp = previewBuilds.filter((build) => build.appId === previewAppId);
    return byApp.slice(0, 8);
  }, [previewBuilds, previewAppId]);

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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Preview builds
            </p>
            <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:gap-3">
              <div className="relative w-full min-w-[220px] md:w-64">
                <input
                  type="search"
                  value={appSearch || selectedAppLabel}
                  onChange={(event) => {
                    setAppSearch(event.target.value);
                    setIsAppDropdownOpen(true);
                  }}
                  onFocus={() => setIsAppDropdownOpen(true)}
                  onBlur={() => {
                    // Delay closing to allow click selection
                    setTimeout(() => setIsAppDropdownOpen(false), 100);
                  }}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Filter apps"
                  aria-label="Filter preview builds by app"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  ▼
                </div>
                {isAppDropdownOpen && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    {filteredAppOptions.map((option) => {
                      const appIcon = option.id !== "all" ? appIconsByApp?.[option.id] : null;
                      const fallbackInitial = option.name.charAt(0).toUpperCase();
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ${
                            option.id === previewAppId
                              ? "font-semibold text-indigo-600 dark:text-indigo-200"
                              : "text-slate-800 dark:text-slate-100"
                          }`}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setPreviewAppId(option.id);
                            setAppSearch("");
                            setIsAppDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600">
                              {appIcon ? (
                                <img
                                  src={appIcon}
                                  alt=""
                                  className="h-full w-full rounded-lg object-cover"
                                />
                              ) : (
                                fallbackInitial
                              )}
                            </span>
                            <span>{option.name}</span>
                          </div>
                          {option.id === previewAppId ? <span className="text-xs">Selected</span> : null}
                        </button>
                      );
                    })}
                    {!filteredAppOptions.length ? (
                      <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                        No apps found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
          {displayPreviewBuilds.length ? (
            <BuildQueueList
              jobs={displayPreviewBuilds.map((build) => ({
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
              <div className="grid grid-cols-1 gap-3">
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
      </div>
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

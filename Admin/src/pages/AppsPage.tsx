import { useState } from "react";

import AppsTable from "../components/AppsTable";
import Icon from "../components/Icon";
import Panel from "../components/Panel";
import Pagination from "../components/Pagination";
import type { ApiApp } from "../lib/apps";
import type { PaginationMeta } from "../lib/pagination";

type AppsPageProps = {
  apps: ApiApp[];
  appIcons?: Record<string, string>;
  onSelectApp?: (app: ApiApp) => void;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

const AppsPage = ({
  apps,
  appIcons,
  onSelectApp,
  pagination,
  onPageChange,
  onPerPageChange,
}: AppsPageProps) => {
  const [platform, setPlatform] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const filteredApps =
    platform === "all"
      ? apps
      : apps.filter((app) => app.platform?.toLowerCase() === platform);

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Filters
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "All" },
                { id: "ios", label: "iOS", icon: "ios" },
                { id: "android", label: "Android", icon: "android" },
              ].map((option) => {
                const isActive = platform === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPlatform(option.id)}
                    className={`flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400/60 dark:bg-indigo-500/20 dark:text-indigo-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                    aria-pressed={isActive}
                  >
                    {option.icon ? <Icon name={option.icon} className="h-4 w-4" /> : null}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Apps
          </p>
        </div>
      </Panel>
      <AppsTable
        apps={filteredApps}
        appIcons={appIcons}
        onSelectApp={onSelectApp}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        perPage={pagination.perPage}
        total={pagination.total}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />
    </div>
  );
};

export default AppsPage;

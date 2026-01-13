import { useEffect, useState } from "react";

import AppsTable from "../components/AppsTable";
import EmptyUploadDropzone from "../components/EmptyUploadDropzone";
import Icon from "../components/Icon";
import Panel from "../components/Panel";
import Pagination from "../components/Pagination";
import type { ApiApp } from "../lib/apps";
import type { PaginationMeta } from "../lib/pagination";

const VIEW_MODE_COOKIE = "apps_view_mode";
const PLATFORM_COOKIE = "apps_platform";

const readViewModeCookie = (): "list" | "grid" => {
  if (typeof document === "undefined") return "list";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VIEW_MODE_COOKIE}=`));
  const value = match?.split("=")[1];
  return value === "grid" ? "grid" : "list";
};

const writeViewModeCookie = (mode: "list" | "grid") => {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 180; // ~6 months
  document.cookie = `${VIEW_MODE_COOKIE}=${mode}; path=/; max-age=${maxAge}`;
};

const writePlatformCookie = (value: string) => {
  if (typeof document === "undefined") return;
  const normalized = value === "ios" || value === "android" ? value : "all";
  const maxAge = 60 * 60 * 24 * 180;
  document.cookie = `${PLATFORM_COOKIE}=${normalized}; path=/; max-age=${maxAge}`;
};

type AppsPageProps = {
  apps: ApiApp[];
  appIcons?: Record<string, string>;
  onSelectApp?: (app: ApiApp) => void;
  platform: string;
  onPlatformChange: (platform: string) => void;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onUpload: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
};

const AppsPage = ({
  apps,
  appIcons,
  onSelectApp,
  platform,
  onPlatformChange,
  pagination,
  onPageChange,
  onPerPageChange,
  onUpload,
}: AppsPageProps) => {
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => readViewModeCookie());
  const [platformValue, setPlatformValue] = useState<string>(platform);

  useEffect(() => {
    if (platformValue !== platform) {
      setPlatformValue(platform);
    }
  }, [platform, platformValue]);

  const handlePlatformChange = (value: string) => {
    const next = value === "ios" || value === "android" ? value : "all";
    setPlatformValue(next);
    writePlatformCookie(next);
    onPlatformChange(next);
  };

  const handleViewChange = (mode: "list" | "grid") => {
    setViewMode(mode);
    writeViewModeCookie(mode);
  };

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
                const isActive = platformValue === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handlePlatformChange(option.id)}
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleViewChange("grid")}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                viewMode === "grid"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400/60 dark:bg-indigo-500/20 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 448 448"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("list")}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                viewMode === "list"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400/60 dark:bg-indigo-500/20 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <Icon name="list" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Panel>
      {apps.length ? (
        <>
          <AppsTable
            apps={apps}
            appIcons={appIcons}
            onSelectApp={onSelectApp}
            viewMode={viewMode}
            onViewChange={handleViewChange}
            platform={platformValue}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            perPage={pagination.perPage}
            total={pagination.total}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        </>
      ) : (
        <EmptyUploadDropzone onUpload={onUpload} />
      )}
    </div>
  );
};

export default AppsPage;

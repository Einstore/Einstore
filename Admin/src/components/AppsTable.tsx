import AppRow from "./AppRow";
import AppAvatar from "./AppAvatar";
import Icon from "./Icon";
import type { ApiApp } from "../lib/apps";
import { formatDate } from "../lib/apps";

type AppsTableProps = {
  apps: ApiApp[];
  appIcons?: Record<string, string>;
  onSelectApp?: (app: ApiApp) => void;
  viewMode: "list" | "grid";
  onViewChange: (next: "list" | "grid") => void;
};

const AppsTable = ({ apps, appIcons, onSelectApp, viewMode, onViewChange }: AppsTableProps) => {
  const renderToggle = () => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onViewChange("grid")}
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
        onClick={() => onViewChange("list")}
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
  );

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Apps
        </p>
        {renderToggle()}
      </div>
      {viewMode === "grid" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => onSelectApp?.(app)}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <AppAvatar
                name={app.name}
                iconUrl={appIcons?.[app.id]}
                platform={app.platform}
                size="md"
              />
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{app.name}</p>
                <p className="text-slate-500 dark:text-slate-400">{app.identifier}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Updated {formatDate(app.updatedAt)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <div className="-mx-5 border-b border-slate-200 pb-3 dark:border-slate-700">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span>App</span>
              <span>Updated</span>
              <span>Created</span>
            </div>
          </div>
          <div className="-mx-5">
            {apps.map((app) => (
              <AppRow
                key={app.id}
                name={app.name}
                identifier={app.identifier}
                updatedAt={formatDate(app.updatedAt)}
                createdAt={formatDate(app.createdAt)}
                iconUrl={appIcons?.[app.id]}
                platform={app.platform}
                onSelect={() => onSelectApp?.(app)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppsTable;

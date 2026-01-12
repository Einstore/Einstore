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
};

const AppsTable = ({ apps, appIcons, onSelectApp, viewMode }: AppsTableProps) => {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800">
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

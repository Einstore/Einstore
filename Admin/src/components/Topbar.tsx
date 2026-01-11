import type { ReactNode } from "react";

import Breadcrumbs from "./Breadcrumbs";
import Icon from "./Icon";

type TopbarProps = {
  title: string;
  breadcrumbs?: { label: string }[];
  actions?: ReactNode;
};

const Topbar = ({ title, breadcrumbs, actions }: TopbarProps) => {
  return (
    <header className="z-20 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
      <div className="space-y-4 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-11 min-w-[220px] flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <Icon name="search" className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search (Ctrl+/)"
              aria-label="Search"
              className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label="Language"
            >
              <Icon name="globe" className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label="Theme"
            >
              <Icon name="moon" className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label="Apps"
            >
              <Icon name="grid" className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label="Notifications"
            >
              <Icon name="bell" className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
              aria-label="Profile"
            >
              <Icon name="user" className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </p>
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
};

export default Topbar;

import type { ReactNode } from "react";

import Icon, { type IconName } from "./Icon";
import type { FeatureFlagKey } from "../lib/featureFlags";

export type NavItem = {
  id: string;
  label: string;
  icon: IconName;
  badge?: string;
  featureFlag?: FeatureFlagKey;
};

type SidebarProps = {
  items: NavItem[];
  activeId: string;
  footer?: ReactNode;
  onSelect?: (id: string) => void;
  teamSwitcher?: ReactNode;
  dropzone?: ReactNode;
};

const Sidebar = ({
  items,
  activeId,
  footer,
  onSelect,
  teamSwitcher,
  dropzone,
}: SidebarProps) => {
  return (
    <aside className="flex h-screen w-64 min-w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        className="flex w-full items-center gap-4 px-6 py-6 text-left"
        onClick={() => onSelect?.("overview")}
        aria-label="Go to overview"
      >
        <img
          src="/brand/einstore-icon-1024.png"
          alt="Einstore"
          className="h-20 w-20 rounded-xl"
        />
        <div className="-ml-[18px]">
          <p className="text-2xl font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
            Einstore
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Admin</p>
        </div>
      </button>

      {teamSwitcher ? <div className="px-4">{teamSwitcher}</div> : null}

      <nav className="mt-6 flex flex-1 flex-col gap-2 px-2">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              className={`flex h-11 items-center gap-3 rounded-lg px-4 text-left text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelect?.(item.id)}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {dropzone ? <div className="px-4 pb-4">{dropzone}</div> : null}
      {footer ? (
        <div className="border-t border-slate-200 px-4 py-4 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
          {footer}
        </div>
      ) : null}
    </aside>
  );
};

export default Sidebar;

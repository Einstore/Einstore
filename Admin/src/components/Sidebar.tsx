import type { ReactNode } from "react";

import Icon, { type IconName } from "./Icon";
import type { FeatureFlagKey } from "../lib/featureFlags";
import { useI18n } from "../lib/i18n";

export type NavItem = {
  id: string;
  label: string;
  icon: IconName;
  badge?: string;
  auxLabel?: string;
  auxBadge?: string;
  auxTone?: "info" | "muted";
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
  const { t } = useI18n();
  return (
    <aside className="flex h-screen w-64 min-w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        className="flex w-full items-center gap-4 px-6 py-6 text-left"
        onClick={() => onSelect?.("overview")}
        aria-label={t("sidebar.overview", "Go to overview")}
      >
        <img
          src="/brand/einstore-icon-1024.png"
          alt={t("brand.einstore", "Einstore")}
          className="h-20 w-20 rounded-xl"
        />
        <div className="-ml-[18px]">
          <p className="text-2xl font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
            {t("brand.einstore", "Einstore")}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{t("brand.admin", "Admin")}</p>
        </div>
      </button>

      {teamSwitcher ? <div className="px-4">{teamSwitcher}</div> : null}

      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
        <nav className="flex flex-col gap-2">
          {items.map((item) => {
            const isActive = item.id === activeId;
            const auxToneClass =
              item.auxTone === "info"
                ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200"
                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300";
            return (
              <div key={item.id} className="flex flex-col gap-1">
                <button
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
                {item.auxLabel && item.auxBadge ? (
                  <div className="flex items-center gap-2 px-6 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <span>{item.auxLabel}</span>
                    <span className={`rounded-full px-2 py-0.5 ${auxToneClass}`}>
                      {item.auxBadge}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {dropzone ? (
          <div className="mt-auto px-4 pb-4 pt-11">{dropzone}</div>
        ) : null}
      </div>
      {footer ? (
        <div className="border-t border-slate-200 px-4 py-4 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
          {footer}
        </div>
      ) : null}
    </aside>
  );
};

export default Sidebar;

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
    <aside className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint text-ink">
          E
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
            Einstore
          </p>
          <p className="font-display text-base text-ink">Admin</p>
        </div>
      </div>

      {teamSwitcher ? <div className="mt-10">{teamSwitcher}</div> : null}

      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              className={`flex h-11 items-center justify-between rounded-xl px-4 text-left text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
                isActive
                  ? "bg-mint text-ink"
                  : "bg-transparent text-ink/60 hover:bg-ink/5"
              }`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelect?.(item.id)}
            >
              <span className="flex items-center gap-3">
                <Icon name={item.icon} className="text-lg" />
                {item.label}
              </span>
              {item.badge ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-white/60 text-ink"
                      : "bg-ink/10 text-ink"
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {dropzone ? <div className="pt-6">{dropzone}</div> : null}
      {footer ? <div className="pt-6">{footer}</div> : null}
    </aside>
  );
};

export default Sidebar;

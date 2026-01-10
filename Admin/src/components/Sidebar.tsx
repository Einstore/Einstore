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
};

const Sidebar = ({ items, activeId, footer, onSelect }: SidebarProps) => {
  return (
    <aside className="flex h-full flex-col rounded-[32px] border border-ink/10 bg-white/70 p-6 shadow-float backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-sand">
          E
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-ink/50">
            Einstore
          </p>
          <p className="font-display text-lg text-ink">Admin</p>
        </div>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-2">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              className={`flex h-11 items-center justify-between rounded-2xl px-4 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
                isActive
                  ? "bg-ink text-sand"
                  : "bg-transparent text-ink/70 hover:bg-ink/10"
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
                      ? "bg-sand/20 text-sand"
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

      {footer ? <div className="pt-6">{footer}</div> : null}
    </aside>
  );
};

export default Sidebar;

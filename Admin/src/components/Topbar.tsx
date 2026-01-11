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
    <div className="flex flex-wrap items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-card">
          A
        </div>
        <div>
          <p className="text-sm text-ink/50">Hi, Alex</p>
          <p className="text-lg font-semibold text-ink">Welcome back</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
          aria-label="Notifications"
        >
          <Icon name="bell" className="text-sm" />
        </button>
        {actions ? <div className="flex gap-3">{actions}</div> : null}
      </div>
      <div className="w-full">
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        <p className="mt-2 text-base font-semibold text-ink">{title}</p>
      </div>
    </div>
  );
};

export default Topbar;

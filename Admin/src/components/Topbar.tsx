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
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            aria-label="Notifications"
          >
            <Icon name="bell" className="h-4 w-4" />
          </button>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
};

export default Topbar;

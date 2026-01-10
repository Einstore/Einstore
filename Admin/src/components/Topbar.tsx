import type { ReactNode } from "react";

import Breadcrumbs from "./Breadcrumbs";

type TopbarProps = {
  title: string;
  breadcrumbs?: { label: string }[];
  actions?: ReactNode;
};

const Topbar = ({ title, breadcrumbs, actions }: TopbarProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-6">
      <div>
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        <h1 className="mt-2 font-display text-4xl text-ink">{title}</h1>
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
};

export default Topbar;

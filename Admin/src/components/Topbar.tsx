import type { ReactNode } from "react";

type TopbarProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

const Topbar = ({ title, subtitle, actions }: TopbarProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-ink/50">
          Admin console
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">{title}</h1>
        {subtitle ? (
          <p className="mt-3 text-base text-ink/70">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
};

export default Topbar;

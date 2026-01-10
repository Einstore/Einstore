import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

const SectionHeader = ({ title, description, actions }: SectionHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
};

export default SectionHeader;

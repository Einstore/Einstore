import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

const Panel = ({ children, className = "" }: PanelProps) => {
  return (
    <div
      className={`rounded-3xl border border-ink/10 bg-white/75 p-6 shadow-float backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
};

export default Panel;

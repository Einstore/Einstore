import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

const Panel = ({ children, className = "" }: PanelProps) => {
  return (
    <div
      className={`rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800 ${className}`}
    >
      {children}
    </div>
  );
};

export default Panel;

import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

const Panel = ({ children, className = "" }: PanelProps) => {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </div>
  );
};

export default Panel;

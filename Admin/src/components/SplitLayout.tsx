import type { ReactNode } from "react";

type SplitLayoutProps = {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
};

const SplitLayout = ({
  left,
  right,
  className = "",
  leftClassName = "col-span-12 lg:col-span-7",
  rightClassName = "col-span-12 lg:col-span-5",
}: SplitLayoutProps) => {
  return (
    <section className={`grid grid-cols-12 gap-6 ${className}`}>
      <div className={leftClassName}>{left}</div>
      <div className={rightClassName}>{right}</div>
    </section>
  );
};

export default SplitLayout;

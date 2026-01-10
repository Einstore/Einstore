import type { ReactNode } from "react";

type SplitLayoutProps = {
  left: ReactNode;
  right: ReactNode;
  className?: string;
};

const SplitLayout = ({ left, right, className = "" }: SplitLayoutProps) => {
  return (
    <section className={`grid gap-6 ${className}`}>
      {left}
      {right}
    </section>
  );
};

export default SplitLayout;

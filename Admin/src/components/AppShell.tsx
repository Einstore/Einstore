import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

const AppShell = ({ sidebar, children }: AppShellProps) => {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900">
      <div className="z-30">{sidebar}</div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default AppShell;

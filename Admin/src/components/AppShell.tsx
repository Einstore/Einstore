import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
  isSidebarOpen?: boolean;
  onSidebarClose?: () => void;
};

const AppShell = ({ sidebar, children, isSidebarOpen, onSidebarClose }: AppShellProps) => {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900">
      <div className="z-30 hidden md:block">{sidebar}</div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
      {isSidebarOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={onSidebarClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">{sidebar}</div>
        </>
      ) : null}
    </div>
  );
};

export default AppShell;

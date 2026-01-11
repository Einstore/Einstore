import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

const AppShell = ({ sidebar, children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-sand">
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8 lg:px-10">
        <div className="hidden w-72 flex-shrink-0 lg:block">{sidebar}</div>
        <div className="flex-1">
          <div className="mx-auto flex max-w-[420px] flex-col gap-6">
            {children}
          </div>
        </div>
      </div>

      <div className="lg:hidden px-6 pb-8">
        <div className="rounded-2xl bg-white p-4 shadow-float">
          {sidebar}
        </div>
      </div>
    </div>
  );
};

export default AppShell;

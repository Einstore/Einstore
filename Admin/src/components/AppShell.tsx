import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

const AppShell = ({ sidebar, children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-sand">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-mist/70 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-20 h-80 w-80 rounded-full bg-coral/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl gap-8 px-6 py-8 lg:px-10">
          <div className="hidden w-72 flex-shrink-0 lg:block">{sidebar}</div>
          <div className="flex-1 space-y-8">{children}</div>
        </div>

        <div className="lg:hidden px-6 pb-10">
          <div className="rounded-[32px] border border-ink/10 bg-white/70 p-6 shadow-float backdrop-blur">
            {sidebar}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;

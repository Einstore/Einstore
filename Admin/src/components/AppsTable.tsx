import AppRow from "./AppRow";
import type { AppSummary } from "../data/mock";

type AppsTableProps = {
  apps: AppSummary[];
  onSelectApp?: (app: AppSummary) => void;
};

const AppsTable = ({ apps, onSelectApp }: AppsTableProps) => {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-float backdrop-blur">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-ink/10 pb-3 text-xs font-semibold uppercase tracking-wide text-ink/50">
        <span>App</span>
        <span>Platform</span>
        <span>Version</span>
        <span>Status</span>
        <span>Updated</span>
      </div>
      <div>
        {apps.map((app) => (
          <AppRow key={app.id} {...app} onSelect={() => onSelectApp?.(app)} />
        ))}
      </div>
    </div>
  );
};

export default AppsTable;

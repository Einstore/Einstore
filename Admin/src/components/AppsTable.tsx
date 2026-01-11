import AppRow from "./AppRow";
import type { ApiApp } from "../lib/apps";
import { formatDate } from "../lib/apps";

type AppsTableProps = {
  apps: ApiApp[];
  onSelectApp?: (app: ApiApp) => void;
};

const AppsTable = ({ apps, onSelectApp }: AppsTableProps) => {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-ink/5 pb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">
        <span>App</span>
        <span>Updated</span>
        <span>Created</span>
      </div>
      <div>
        {apps.map((app) => (
          <AppRow
            key={app.id}
            name={app.name}
            identifier={app.identifier}
            updatedAt={formatDate(app.updatedAt)}
            createdAt={formatDate(app.createdAt)}
            onSelect={() => onSelectApp?.(app)}
          />
        ))}
      </div>
    </div>
  );
};

export default AppsTable;

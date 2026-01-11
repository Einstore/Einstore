import Panel from "./Panel";
import ProgressBar from "./ProgressBar";
import { formatBytes } from "../lib/apps";

type StorageCardProps = {
  label: string;
  usedBytes: number;
  totalBytes: number;
  builds?: number;
};

const StorageCard = ({ label, usedBytes, totalBytes, builds = 0 }: StorageCardProps) => {
  const safeTotal = totalBytes > 0 ? totalBytes : 1;
  const percent = Math.min(100, Math.round((usedBytes / safeTotal) * 100));
  const formattedUsed = formatBytes(usedBytes);
  const formattedTotal = formatBytes(totalBytes);
  const buildsLabel = builds === 1 ? "build" : "builds";

  return (
    <Panel className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {formattedUsed} / {formattedTotal} ({percent}%)
        </p>
      </div>
      <ProgressBar value={usedBytes} max={safeTotal} />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {builds ? `${builds} ${buildsLabel} stored` : "No stored builds yet."}
      </p>
    </Panel>
  );
};

export default StorageCard;

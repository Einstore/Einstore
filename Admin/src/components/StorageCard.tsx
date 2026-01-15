import Panel from "./Panel";
import ProgressBar from "./ProgressBar";
import { formatBytes } from "../lib/apps";
import { useI18n } from "../lib/i18n";

type StorageCardProps = {
  label: string;
  usedBytes: number;
  totalBytes: number;
  builds?: number;
};

const StorageCard = ({ label, usedBytes, totalBytes, builds = 0 }: StorageCardProps) => {
  const { t } = useI18n();
  const safeTotal = totalBytes > 0 ? totalBytes : 1;
  const percent = Math.min(100, Math.round((usedBytes / safeTotal) * 100));
  const formattedUsed = formatBytes(usedBytes);
  const formattedTotal = formatBytes(totalBytes);
  const storedLabel = builds
    ? t(
        "storage.buildsStored",
        { one: "{count} build stored", other: "{count} builds stored" },
        { count: builds }
      )
    : t("storage.none", "No stored builds yet.");

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
        {storedLabel}
      </p>
    </Panel>
  );
};

export default StorageCard;

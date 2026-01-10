import Panel from "./Panel";
import ProgressBar from "./ProgressBar";

type StorageCardProps = {
  label: string;
  used: number;
  total: number;
};

const StorageCard = ({ label, used, total }: StorageCardProps) => {
  return (
    <Panel className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          {label}
        </p>
        <p className="text-sm text-ink/60">
          {used}% / {total}%
        </p>
      </div>
      <ProgressBar value={used} max={total} />
      <p className="text-xs text-ink/60">
        {used}% of bucket capacity is currently allocated.
      </p>
    </Panel>
  );
};

export default StorageCard;

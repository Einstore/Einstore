import Panel from "./Panel";
import StatusPill from "./StatusPill";
import { useI18n } from "../lib/i18n";

type PipelineStageCardProps = {
  label: string;
  status: "healthy" | "warning" | "critical";
  notes: string;
};

const PipelineStageCard = ({
  label,
  status,
  notes,
}: PipelineStageCardProps) => {
  const { t } = useI18n();
  const statusLabel = t(`status.${status}`, status);
  return (
    <Panel className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {notes}
        </p>
      </div>
      <StatusPill status={status} label={statusLabel} />
    </Panel>
  );
};

export default PipelineStageCard;

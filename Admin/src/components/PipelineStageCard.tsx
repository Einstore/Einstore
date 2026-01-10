import Panel from "./Panel";
import StatusPill from "./StatusPill";

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
  return (
    <Panel className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          {label}
        </p>
        <p className="mt-2 text-lg font-display text-ink">{notes}</p>
      </div>
      <StatusPill status={status} label={status} />
    </Panel>
  );
};

export default PipelineStageCard;

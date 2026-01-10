import Panel from "./Panel";
import StatusPill from "./StatusPill";

type AlertCardProps = {
  title: string;
  detail: string;
  status: "healthy" | "warning" | "critical";
  owner: string;
  time: string;
};

const AlertCard = ({ title, detail, status, owner, time }: AlertCardProps) => {
  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <StatusPill status={status} label={status} />
        <span className="text-xs text-ink/60">{time}</span>
      </div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-sm text-ink/70">{detail}</p>
      </div>
      <p className="text-xs text-ink/60">Owner: {owner}</p>
    </Panel>
  );
};

export default AlertCard;

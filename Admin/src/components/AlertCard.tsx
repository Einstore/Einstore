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
        <span className="text-xs text-slate-500 dark:text-slate-400">{time}</span>
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Owner: {owner}</p>
    </Panel>
  );
};

export default AlertCard;

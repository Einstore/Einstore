import Panel from "./Panel";
import StatusPill from "./StatusPill";

type SecurityPolicyCardProps = {
  title: string;
  owner: string;
  lastReview: string;
  status: "healthy" | "warning" | "critical";
};

const SecurityPolicyCard = ({
  title,
  owner,
  lastReview,
  status,
}: SecurityPolicyCardProps) => {
  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <StatusPill status={status} label={status} />
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        <p>Owner: {owner}</p>
        <p>Last reviewed: {lastReview}</p>
      </div>
    </Panel>
  );
};

export default SecurityPolicyCard;

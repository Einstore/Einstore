import StatusPill from "./StatusPill";

type AuditRowProps = {
  title: string;
  owner: string;
  time: string;
  status: "healthy" | "warning" | "critical";
};

const AuditRow = ({ title, owner, time, status }: AuditRowProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 py-4 text-sm last:border-b-0">
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-ink/60">Owner: {owner}</p>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-ink/50">{time}</p>
        <StatusPill status={status} label={status} />
      </div>
    </div>
  );
};

export default AuditRow;

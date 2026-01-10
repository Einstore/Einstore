import StatusPill from "./StatusPill";

export type BuildRowProps = {
  name: string;
  branch: string;
  status: "queued" | "running" | "failed" | "success";
  startedAt: string;
  owner: string;
};

const BuildRow = ({ name, branch, status, startedAt, owner }: BuildRowProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 py-4 text-sm last:border-b-0">
      <div>
        <p className="font-semibold text-ink">{name}</p>
        <p className="text-ink/60">{branch}</p>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-ink/60">{owner}</p>
        <p className="text-ink/50">{startedAt}</p>
        <StatusPill status={status} />
      </div>
    </div>
  );
};

export default BuildRow;

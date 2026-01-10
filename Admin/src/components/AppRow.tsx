import StatusPill from "./StatusPill";

export type AppRowProps = {
  name: string;
  platform: "iOS" | "Android";
  version: string;
  build: number;
  status: "live" | "review" | "paused";
  updatedAt: string;
  team: string;
  onSelect?: () => void;
};

const AppRow = ({
  name,
  platform,
  version,
  build,
  status,
  updatedAt,
  team,
  onSelect,
}: AppRowProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 border-b border-ink/10 py-4 text-left text-sm transition hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 last:border-b-0"
    >
      <div className="flex flex-col">
        <span className="font-semibold text-ink">{name}</span>
        <span className="text-ink/60">{team}</span>
      </div>
      <div className="text-ink/70">{platform}</div>
      <div className="text-ink/70">
        v{version} - {build}
      </div>
      <StatusPill status={status} />
      <div className="text-ink/60">{updatedAt}</div>
    </button>
  );
};

export default AppRow;

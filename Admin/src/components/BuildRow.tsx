export type BuildRowProps = {
  name: string;
  buildNumber: string;
  size: string;
  createdAt: string;
  storageKind?: string | null;
};

const BuildRow = ({ name, buildNumber, size, createdAt, storageKind }: BuildRowProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/5 py-4 text-sm last:border-b-0">
      <div>
        <p className="font-semibold text-ink">{name}</p>
        <p className="text-ink/60">Build #{buildNumber}</p>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-ink/60">{storageKind ? storageKind.toUpperCase() : "—"}</p>
        <p className="text-ink/60">{size}</p>
        <p className="text-ink/50">{createdAt}</p>
      </div>
    </div>
  );
};

export default BuildRow;

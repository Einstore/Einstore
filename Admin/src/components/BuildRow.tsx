export type BuildRowProps = {
  name: string;
  buildNumber: string;
  size: string;
  createdAt: string;
  storageKind?: string | null;
};

const BuildRow = ({ name, buildNumber, size, createdAt, storageKind }: BuildRowProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-4 text-sm last:border-b-0 dark:border-slate-700">
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{name}</p>
        <p className="text-slate-500 dark:text-slate-400">Build #{buildNumber}</p>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-slate-500 dark:text-slate-400">
          {storageKind ? storageKind.toUpperCase() : "—"}
        </p>
        <p className="text-slate-500 dark:text-slate-400">{size}</p>
        <p className="text-slate-400 dark:text-slate-500">{createdAt}</p>
      </div>
    </div>
  );
};

export default BuildRow;

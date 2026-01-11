export type AppRowProps = {
  name: string;
  identifier: string;
  updatedAt: string;
  createdAt: string;
  onSelect?: () => void;
};

const AppRow = ({
  name,
  identifier,
  updatedAt,
  createdAt,
  onSelect,
}: AppRowProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 border-b border-ink/10 py-4 text-left text-sm transition hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 last:border-b-0"
    >
      <div className="flex flex-col">
        <span className="font-semibold text-ink">{name}</span>
        <span className="text-ink/60">{identifier}</span>
      </div>
      <div className="text-ink/60">{updatedAt}</div>
      <div className="text-ink/50">{createdAt}</div>
    </button>
  );
};

export default AppRow;

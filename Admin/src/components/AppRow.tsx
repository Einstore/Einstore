import AppAvatar from "./AppAvatar";

export type AppRowProps = {
  name: string;
  identifier: string;
  updatedAt: string;
  createdAt: string;
  iconUrl?: string | null;
  platform?: string | null;
  onSelect?: () => void;
};

const AppRow = ({
  name,
  identifier,
  updatedAt,
  createdAt,
  iconUrl,
  platform,
  onSelect,
}: AppRowProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 border-b border-slate-200 px-5 py-4 text-left text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 last:border-b-0 dark:border-slate-700 dark:hover:bg-slate-700"
    >
      <div className="flex items-center gap-3">
        <AppAvatar name={name} iconUrl={iconUrl} platform={platform} />
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {name}
          </span>
          <span className="text-slate-500 dark:text-slate-400">{identifier}</span>
        </div>
      </div>
      <div className="text-slate-500 dark:text-slate-400">{updatedAt}</div>
      <div className="text-slate-400 dark:text-slate-500">{createdAt}</div>
    </button>
  );
};

export default AppRow;

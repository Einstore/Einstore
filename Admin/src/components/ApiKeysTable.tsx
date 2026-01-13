type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  createdAt?: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  expiresAt?: string | null;
};

type ApiKeysTableProps = {
  apiKeys: ApiKeyRecord[];
  selectedId?: string | null;
  onSelect: (key: ApiKeyRecord) => void;
  onRevoke: (key: ApiKeyRecord) => void;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const ApiKeysTable = ({ apiKeys, selectedId, onSelect, onRevoke }: ApiKeysTableProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="-mx-5 border-b border-slate-200 pb-3 dark:border-slate-700">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,0.8fr)] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <span>Name</span>
          <span>Created</span>
          <span>Last used</span>
          <span className="text-right">Actions</span>
        </div>
      </div>
      <div className="-mx-5">
        {apiKeys.map((key) => {
          const isSelected = key.id === selectedId;
          return (
            <div
              key={key.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              title={`Key prefix: ${key.prefix}...`}
              onClick={() => onSelect(key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(key);
                }
              }}
              className={`grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,0.8fr)] gap-4 border-b border-slate-200 px-5 py-4 text-sm last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-700 ${
                isSelected
                  ? "bg-indigo-50 dark:bg-indigo-500/10"
                  : "hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {key.name}
                </div>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {formatDateTime(key.createdAt)}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {formatDateTime(key.lastUsedAt)}
              </div>
              <div className="flex justify-end">
                {key.revokedAt ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500">Revoked</span>
                ) : (
                  <button
                    type="button"
                    className="h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-200 dark:hover:bg-rose-500/10"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRevoke(key);
                    }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export type { ApiKeyRecord };
export default ApiKeysTable;

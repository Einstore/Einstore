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

const statusLabel = (key: ApiKeyRecord) => {
  if (key.revokedAt) return "Revoked";
  if (key.expiresAt) {
    const expiry = new Date(key.expiresAt);
    if (!Number.isNaN(expiry.getTime()) && expiry < new Date()) {
      return "Expired";
    }
  }
  return "Active";
};

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Revoked: "bg-slate-100 text-slate-600",
  Expired: "bg-amber-100 text-amber-700",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const ApiKeysTable = ({ apiKeys, selectedId, onSelect, onRevoke }: ApiKeysTableProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-4 border-b border-slate-200 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Name</span>
        <span>Key</span>
        <span>Created</span>
        <span>Last used</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>
      <div>
        {apiKeys.map((key) => {
          const status = statusLabel(key);
          const isSelected = key.id === selectedId;
          return (
            <div
              key={key.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => onSelect(key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(key);
                }
              }}
              className={`grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-4 border-b border-slate-200 py-4 text-sm last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900">{key.name}</div>
                <div className="text-xs text-slate-400">ID: {key.id}</div>
              </div>
              <div className="text-slate-500">{key.prefix}...</div>
              <div className="text-slate-500">{formatDateTime(key.createdAt)}</div>
              <div className="text-slate-500">{formatDateTime(key.lastUsedAt)}</div>
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    statusStyles[status] ?? statusStyles.Active
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="flex justify-end">
                {key.revokedAt ? (
                  <span className="text-xs text-slate-400">Revoked</span>
                ) : (
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-600"
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

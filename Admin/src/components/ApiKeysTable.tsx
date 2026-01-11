import ActionButton from "./ActionButton";
import { formatDateTime } from "../lib/apps";
import type { ApiKeySummary } from "../lib/apiKeys";

const statusLabel = (key: ApiKeySummary) => {
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
  Active: "bg-green-100 text-green-700",
  Revoked: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  Expired: "bg-amber-100 text-amber-700",
};

const ApiKeysTable = ({
  keys,
  onRevoke,
}: {
  keys: ApiKeySummary[];
  onRevoke: (key: ApiKeySummary) => void;
}) => {
  if (keys.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
        No API keys yet. Create one for CI uploads.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-4 border-b border-slate-200 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <span>Name</span>
        <span>Key</span>
        <span>Created</span>
        <span>Last used</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>
      <div>
        {keys.map((key) => {
          const status = statusLabel(key);
          return (
            <div
              key={key.id}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-4 border-b border-slate-200 py-4 text-sm last:border-b-0 dark:border-slate-700"
            >
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {key.name}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  ID: {key.id}
                </div>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {key.prefix}...
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {formatDateTime(key.createdAt)}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {formatDateTime(key.lastUsedAt)}
              </div>
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    statusStyles[status]
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="flex justify-end">
                {key.revokedAt ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Revoked
                  </span>
                ) : (
                  <ActionButton
                    label="Revoke"
                    variant="danger"
                    onClick={() => onRevoke(key)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApiKeysTable;

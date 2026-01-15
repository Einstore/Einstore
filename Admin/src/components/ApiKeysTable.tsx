import { useI18n } from "../lib/i18n";

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

const formatDateTime = (value: string | null | undefined, locale: string, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const ApiKeysTable = ({ apiKeys, selectedId, onSelect, onRevoke }: ApiKeysTableProps) => {
  const { t, locale } = useI18n();
  const dash = t("common.emptyDash", "—");
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="-mx-5 border-b border-slate-200 pb-3 dark:border-slate-700">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,0.8fr)] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <span>{t("apiKeys.header.name", "Name")}</span>
          <span>{t("apiKeys.header.created", "Created")}</span>
          <span>{t("apiKeys.header.lastUsed", "Last used")}</span>
          <span className="text-right">{t("common.actions", "Actions")}</span>
        </div>
      </div>
      <div className="-mx-5">
        {apiKeys.map((key) => {
          const isSelected = key.id === selectedId;
          return (
            <div className="relative">
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
                className={`group grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,0.8fr)] gap-4 border-b border-slate-200 px-5 py-4 text-sm last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-700 ${
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
                {formatDateTime(key.createdAt, locale, dash)}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {formatDateTime(key.lastUsedAt, locale, dash)}
              </div>
                <div className="flex justify-end">
                  {key.revokedAt ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {t("apiKeys.status.revoked", "Revoked")}
                    </span>
                  ) : (
                    <button
                      type="button"
                    className="h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-200 dark:hover:bg-rose-500/10"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRevoke(key);
                    }}
                    >
                      {t("apiKeys.action.revoke", "Revoke")}
                    </button>
                  )}
                </div>
              </div>
              <div className="pointer-events-none absolute left-1/2 top-2 z-20 hidden -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm group-hover:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {t("apiKeys.prefix", "Key prefix:")} <span className="font-mono">{key.prefix}...</span>
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

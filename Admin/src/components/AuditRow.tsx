import StatusPill from "./StatusPill";
import { useI18n } from "../lib/i18n";

type AuditRowProps = {
  title: string;
  owner: string;
  time: string;
  status: "healthy" | "warning" | "critical";
};

const AuditRow = ({ title, owner, time, status }: AuditRowProps) => {
  const { t } = useI18n();
  const statusLabel = t(`status.${status}`, status);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-4 text-sm last:border-b-0 dark:border-slate-700">
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-slate-500 dark:text-slate-400">
          {t("security.owner", "Owner: {owner}", { owner })}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-slate-400 dark:text-slate-500">{time}</p>
        <StatusPill status={status} label={statusLabel} />
      </div>
    </div>
  );
};

export default AuditRow;

import Panel from "./Panel";
import StatusPill from "./StatusPill";
import { useI18n } from "../lib/i18n";

type AlertCardProps = {
  title: string;
  detail: string;
  status: "healthy" | "warning" | "critical";
  owner: string;
  time: string;
};

const AlertCard = ({ title, detail, status, owner, time }: AlertCardProps) => {
  const { t } = useI18n();
  const statusLabel = t(`status.${status}`, status);
  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <StatusPill status={status} label={statusLabel} />
        <span className="text-xs text-slate-500 dark:text-slate-400">{time}</span>
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t("security.owner", "Owner: {owner}", { owner })}
      </p>
    </Panel>
  );
};

export default AlertCard;

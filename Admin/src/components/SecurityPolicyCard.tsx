import Panel from "./Panel";
import StatusPill from "./StatusPill";
import { useI18n } from "../lib/i18n";

type SecurityPolicyCardProps = {
  title: string;
  owner: string;
  lastReview: string;
  status: "healthy" | "warning" | "critical";
};

const SecurityPolicyCard = ({
  title,
  owner,
  lastReview,
  status,
}: SecurityPolicyCardProps) => {
  const { t } = useI18n();
  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <StatusPill status={status} label={status} />
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        <p>{t("security.owner", "Owner: {owner}", { owner })}</p>
        <p>{t("security.lastReviewed", "Last reviewed: {date}", { date: lastReview })}</p>
      </div>
    </Panel>
  );
};

export default SecurityPolicyCard;

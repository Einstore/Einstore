import Panel from "./Panel";

type ActivityItemCardProps = {
  title: string;
  detail: string;
  time: string;
  tag: string;
};

const ActivityItemCard = ({
  title,
  detail,
  time,
  tag,
}: ActivityItemCardProps) => {
  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-300">
          {tag}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{time}</span>
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
    </Panel>
  );
};

export default ActivityItemCard;

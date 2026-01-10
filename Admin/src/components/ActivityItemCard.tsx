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
        <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">
          {tag}
        </span>
        <span className="text-xs text-ink/60">{time}</span>
      </div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-sm text-ink/70">{detail}</p>
      </div>
    </Panel>
  );
};

export default ActivityItemCard;

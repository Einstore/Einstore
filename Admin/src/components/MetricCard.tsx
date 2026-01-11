import Panel from "./Panel";

type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
};

const trendStyles = {
  up: "text-green-600",
  down: "text-red-500",
  flat: "text-slate-500",
} as const;

const MetricCard = ({ label, value, delta, trend }: MetricCardProps) => {
  return (
    <Panel className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className={`text-sm font-semibold ${trendStyles[trend]}`}>
          {delta}
        </span>
      </div>
      <div className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </Panel>
  );
};

export default MetricCard;

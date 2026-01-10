import Panel from "./Panel";

type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
};

const trendStyles = {
  up: "text-teal",
  down: "text-coral",
  flat: "text-ink/60",
} as const;

const MetricCard = ({ label, value, delta, trend }: MetricCardProps) => {
  return (
    <Panel className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          {label}
        </span>
        <span className={`text-sm font-semibold ${trendStyles[trend]}`}>
          {delta}
        </span>
      </div>
      <div className="text-3xl font-display text-ink">{value}</div>
    </Panel>
  );
};

export default MetricCard;

import MetricCard from "../components/MetricCard";
import SectionHeader from "../components/SectionHeader";
import type { Metric } from "../data/mock";

type OverviewSectionProps = {
  metrics: Metric[];
};

const OverviewSection = ({ metrics }: OverviewSectionProps) => {
  return (
    <section className="space-y-6">
      <SectionHeader
        title="Signal overview"
        description="Live metrics from the last 24 hours across environments and policy gates."
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
};

export default OverviewSection;

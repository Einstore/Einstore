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
      <div className="grid grid-cols-12 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="col-span-12 md:col-span-6 xl:col-span-4">
            <MetricCard {...metric} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default OverviewSection;

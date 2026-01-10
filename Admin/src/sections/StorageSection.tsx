import SectionHeader from "../components/SectionHeader";
import StorageCard from "../components/StorageCard";
import type { StorageBucket } from "../data/mock";

type StorageSectionProps = {
  buckets: StorageBucket[];
};

const StorageSection = ({ buckets }: StorageSectionProps) => {
  return (
    <section className="space-y-6">
      <SectionHeader
        title="Storage usage"
        description="Capacity distribution across critical buckets."
      />
      <div className="grid gap-6">
        {buckets.map((bucket) => (
          <StorageCard key={bucket.id} {...bucket} />
        ))}
      </div>
    </section>
  );
};

export default StorageSection;

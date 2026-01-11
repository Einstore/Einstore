import SectionHeader from "../components/SectionHeader";
import StorageCard from "../components/StorageCard";
import type { StorageBucket } from "../data/mock";

type StorageSectionProps = {
  buckets: StorageBucket[];
};

const StorageSection = ({ buckets }: StorageSectionProps) => {
  return (
    <section className="space-y-6">
      <SectionHeader title="Storage usage" />
      <div className="grid grid-cols-12 gap-6">
        {buckets.map((bucket) => (
          <div key={bucket.id} className="col-span-12">
            <StorageCard {...bucket} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default StorageSection;

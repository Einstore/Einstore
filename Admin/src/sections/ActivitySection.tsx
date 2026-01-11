import ActivityItemCard from "../components/ActivityItemCard";
import SectionHeader from "../components/SectionHeader";
import type { ActivityItem } from "../data/mock";

type ActivitySectionProps = {
  items: ActivityItem[];
};

const ActivitySection = ({ items }: ActivitySectionProps) => {
  return (
    <section className="space-y-6">
      <SectionHeader
        title="Activity stream"
        description="Recent actions taken by the operations team."
      />
      <div className="grid grid-cols-12 gap-6">
        {items.map((item) => (
          <div key={item.id} className="col-span-12">
            <ActivityItemCard {...item} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ActivitySection;

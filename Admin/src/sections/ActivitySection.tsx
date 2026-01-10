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
      <div className="grid gap-6">
        {items.map((item) => (
          <ActivityItemCard key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
};

export default ActivitySection;

import ActivityItemCard from "../components/ActivityItemCard";
import SectionHeader from "../components/SectionHeader";
import type { ActivityItem } from "../data/mock";
import { useI18n } from "../lib/i18n";

type ActivitySectionProps = {
  items: ActivityItem[];
};

const ActivitySection = ({ items }: ActivitySectionProps) => {
  const { t } = useI18n();
  return (
    <section className="space-y-6">
      <SectionHeader
        title={t("activity.stream.title", "Activity stream")}
        description={t("activity.stream.subtitle", "Recent actions taken by the operations team.")}
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

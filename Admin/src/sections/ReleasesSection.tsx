import AppsTable from "../components/AppsTable";
import SectionHeader from "../components/SectionHeader";
import type { AppSummary } from "../data/mock";

type ReleasesSectionProps = {
  apps: AppSummary[];
};

const ReleasesSection = ({ apps }: ReleasesSectionProps) => {
  return (
    <section className="space-y-6">
      <SectionHeader
        title="Active releases"
        description="Apps currently live or awaiting approval."
      />
      <AppsTable apps={apps} />
    </section>
  );
};

export default ReleasesSection;

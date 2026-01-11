import BuildQueueList from "../components/BuildQueueList";
import SectionHeader from "../components/SectionHeader";
import type { BuildJob } from "../data/mock";

type BuildQueueSectionProps = {
  jobs: BuildJob[];
};

const BuildQueueSection = ({ jobs }: BuildQueueSectionProps) => {
  return (
    <section className="space-y-6">
      <BuildQueueList jobs={jobs} />
    </section>
  );
};

export default BuildQueueSection;

import BuildQueueList from "../components/BuildQueueList";
import SectionHeader from "../components/SectionHeader";
import type { BuildJob } from "../data/mock";

type BuildQueueSectionProps = {
  jobs: BuildJob[];
  onSelectBuild?: (id: string) => void;
};

const BuildQueueSection = ({ jobs, onSelectBuild }: BuildQueueSectionProps) => {
  return (
    <section className="space-y-6">
      <BuildQueueList jobs={jobs} onSelect={onSelectBuild} />
    </section>
  );
};

export default BuildQueueSection;

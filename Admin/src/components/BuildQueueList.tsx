import BuildRow from "./BuildRow";
import type { BuildJob } from "../data/mock";

type BuildQueueListProps = {
  jobs: BuildJob[];
};

const BuildQueueList = ({ jobs }: BuildQueueListProps) => {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-float backdrop-blur">
      {jobs.map((job) => (
        <BuildRow key={job.id} {...job} />
      ))}
    </div>
  );
};

export default BuildQueueList;

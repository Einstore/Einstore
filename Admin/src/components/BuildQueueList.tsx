import BuildRow from "./BuildRow";
import type { ApiBuild } from "../lib/apps";
import { formatBytes, formatDateTime } from "../lib/apps";

type BuildQueueListProps = {
  jobs: ApiBuild[];
};

const BuildQueueList = ({ jobs }: BuildQueueListProps) => {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      {jobs.map((job) => (
        <BuildRow
          key={job.id}
          name={job.displayName}
          buildNumber={job.buildNumber}
          size={formatBytes(job.sizeBytes)}
          createdAt={formatDateTime(job.createdAt)}
          storageKind={job.storageKind}
        />
      ))}
    </div>
  );
};

export default BuildQueueList;

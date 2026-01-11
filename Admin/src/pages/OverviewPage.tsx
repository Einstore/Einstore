import OverviewSection from "../sections/OverviewSection";
import ReleasesSection from "../sections/ReleasesSection";
import StorageSection from "../sections/StorageSection";
import BuildQueueSection from "../sections/BuildQueueSection";
import SplitLayout from "../components/SplitLayout";
import type {
  AppSummary,
  BuildJob,
  Metric,
} from "../data/mock";
import type { StorageUsageUser } from "../types/usage";

type OverviewPageProps = {
  metrics: Metric[];
  apps: AppSummary[];
  buildQueue: BuildJob[];
  storageUsage: StorageUsageUser[];
  storageTotalBytes: number;
  isStorageLoading?: boolean;
  showMetrics?: boolean;
  showStorage?: boolean;
};

const OverviewPage = ({
  metrics,
  apps,
  buildQueue,
  storageUsage,
  storageTotalBytes,
  isStorageLoading = false,
  showMetrics = false,
  showStorage = false,
}: OverviewPageProps) => {
  return (
    <div className="space-y-10">
      {showMetrics ? <OverviewSection metrics={metrics} /> : null}
      <SplitLayout
        left={<ReleasesSection apps={apps} />}
        right={<BuildQueueSection jobs={buildQueue} />}
        leftClassName="col-span-12 xl:col-span-7"
        rightClassName="col-span-12 xl:col-span-5"
      />
      {showStorage ? (
        <StorageSection
          users={storageUsage}
          totalBytes={storageTotalBytes}
          isLoading={isStorageLoading}
        />
      ) : null}
    </div>
  );
};

export default OverviewPage;

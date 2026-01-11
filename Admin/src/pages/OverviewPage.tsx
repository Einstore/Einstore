import ActivitySection from "../sections/ActivitySection";
import OverviewSection from "../sections/OverviewSection";
import PipelineSection from "../sections/PipelineSection";
import ReleasesSection from "../sections/ReleasesSection";
import StorageSection from "../sections/StorageSection";
import BuildQueueSection from "../sections/BuildQueueSection";
import SplitLayout from "../components/SplitLayout";
import type {
  ActivityItem,
  AppSummary,
  BuildJob,
  Metric,
  PipelineStage,
  StorageBucket,
} from "../data/mock";

type OverviewPageProps = {
  metrics: Metric[];
  pipelineStages: PipelineStage[];
  apps: AppSummary[];
  buildQueue: BuildJob[];
  activity: ActivityItem[];
  storageBuckets: StorageBucket[];
  showMetrics?: boolean;
  showPipeline?: boolean;
  showActivity?: boolean;
  showStorage?: boolean;
};

const OverviewPage = ({
  metrics,
  pipelineStages,
  apps,
  buildQueue,
  activity,
  storageBuckets,
  showMetrics = false,
  showPipeline = false,
  showActivity = false,
  showStorage = false,
}: OverviewPageProps) => {
  const showActivityStorage = showActivity || showStorage;
  const showBothActivityStorage = showActivity && showStorage;

  return (
    <>
      {showMetrics ? <OverviewSection metrics={metrics} /> : null}
      {showPipeline ? <PipelineSection stages={pipelineStages} /> : null}
      <SplitLayout
        left={<ReleasesSection apps={apps} />}
        right={<BuildQueueSection jobs={buildQueue} />}
        leftClassName="col-span-12 xl:col-span-7"
        rightClassName="col-span-12 xl:col-span-5"
      />
      {showActivityStorage && !showBothActivityStorage ? (
        showActivity ? (
          <ActivitySection items={activity} />
        ) : (
          <StorageSection buckets={storageBuckets} />
        )
      ) : null}
      {showBothActivityStorage ? (
        <SplitLayout
          left={<ActivitySection items={activity} />}
          right={<StorageSection buckets={storageBuckets} />}
          leftClassName="col-span-12 xl:col-span-6"
          rightClassName="col-span-12 xl:col-span-6"
        />
      ) : null}
    </>
  );
};

export default OverviewPage;

import AlertCard from "../components/AlertCard";
import PipelineStageCard from "../components/PipelineStageCard";
import SectionHeader from "../components/SectionHeader";
import type { PipelineAlert, PipelineStage } from "../data/mock";

type PipelinesPageProps = {
  stages: PipelineStage[];
  alerts: PipelineAlert[];
};

const PipelinesPage = ({ stages, alerts }: PipelinesPageProps) => {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pipeline status"
        description="Review throughput, queue pressure, and distribution health."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {stages.map((stage) => (
          <PipelineStageCard key={stage.id} {...stage} />
        ))}
      </div>
      <SectionHeader
        title="Open alerts"
        description="Escalations that require team follow-up."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} {...alert} />
        ))}
      </div>
    </div>
  );
};

export default PipelinesPage;

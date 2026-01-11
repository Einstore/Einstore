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
      <div className="grid grid-cols-12 gap-6">
        {stages.map((stage) => (
          <div key={stage.id} className="col-span-12 md:col-span-6 xl:col-span-4">
            <PipelineStageCard {...stage} />
          </div>
        ))}
      </div>
      <SectionHeader
        title="Open alerts"
        description="Escalations that require team follow-up."
      />
      <div className="grid grid-cols-12 gap-6">
        {alerts.map((alert) => (
          <div key={alert.id} className="col-span-12 md:col-span-6 xl:col-span-4">
            <AlertCard {...alert} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelinesPage;

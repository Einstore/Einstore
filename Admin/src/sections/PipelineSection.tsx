import ActionButton from "../components/ActionButton";
import PipelineStageCard from "../components/PipelineStageCard";
import SectionHeader from "../components/SectionHeader";
import type { PipelineStage } from "../data/mock";

type PipelineSectionProps = {
  stages: PipelineStage[];
};

const PipelineSection = ({ stages }: PipelineSectionProps) => {
  return (
    <section className="space-y-6">
      <SectionHeader
        title="Pipeline health"
        description="Track the stages that feed approvals and distribution."
        actions={<ActionButton label="Review incidents" variant="primary" />}
      />
      <div className="grid gap-6 md:grid-cols-2">
        {stages.map((stage) => (
          <PipelineStageCard key={stage.id} {...stage} />
        ))}
      </div>
    </section>
  );
};

export default PipelineSection;

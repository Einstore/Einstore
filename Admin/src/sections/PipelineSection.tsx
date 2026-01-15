import ActionButton from "../components/ActionButton";
import PipelineStageCard from "../components/PipelineStageCard";
import SectionHeader from "../components/SectionHeader";
import type { PipelineStage } from "../data/mock";
import { useI18n } from "../lib/i18n";

type PipelineSectionProps = {
  stages: PipelineStage[];
};

const PipelineSection = ({ stages }: PipelineSectionProps) => {
  const { t } = useI18n();
  return (
    <section className="space-y-6">
      <SectionHeader
        title={t("pipeline.health.title", "Pipeline health")}
        description={t("pipeline.health.subtitle", "Track the stages that feed approvals and distribution.")}
        actions={<ActionButton label={t("pipeline.health.cta", "Review incidents")} variant="primary" />}
      />
      <div className="grid grid-cols-12 gap-6">
        {stages.map((stage) => (
          <div key={stage.id} className="col-span-12 md:col-span-6 xl:col-span-4">
            <PipelineStageCard {...stage} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PipelineSection;

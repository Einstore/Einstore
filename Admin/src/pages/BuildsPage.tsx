import BuildQueueList from "../components/BuildQueueList";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import StatusPill from "../components/StatusPill";
import type { BuildJob } from "../data/mock";

type BuildsPageProps = {
  builds: BuildJob[];
};

const BuildsPage = ({ builds }: BuildsPageProps) => {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Build operations"
        description="Monitor queued builds and triage failures in real time."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Panel className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            Current queue
          </p>
          <p className="text-3xl font-display text-ink">{builds.length}</p>
          <StatusPill status="running" label="Live" />
        </Panel>
        <Panel className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            Failed in 24h
          </p>
          <p className="text-3xl font-display text-ink">2</p>
          <StatusPill status="failed" label="Needs review" />
        </Panel>
        <Panel className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            Average build time
          </p>
          <p className="text-3xl font-display text-ink">18m</p>
          <StatusPill status="healthy" label="Stable" />
        </Panel>
      </div>
      <BuildQueueList jobs={builds} />
    </div>
  );
};

export default BuildsPage;

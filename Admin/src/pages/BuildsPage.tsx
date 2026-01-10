import BuildQueueList from "../components/BuildQueueList";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import StatusPill from "../components/StatusPill";
import type { BuildJob } from "../data/mock";

type BuildsPageProps = {
  builds: BuildJob[];
  selectedAppName?: string | null;
};

const BuildsPage = ({ builds, selectedAppName }: BuildsPageProps) => {
  const visibleBuilds = selectedAppName
    ? builds.filter((build) => build.name === selectedAppName)
    : builds;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Latest builds"
        description="Recent builds tied to your apps and release workflows."
      />
      {selectedAppName ? (
        <Panel className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-ink/50">
              Selected app
            </p>
            <p className="mt-2 text-xl font-display text-ink">
              {selectedAppName}
            </p>
          </div>
          <StatusPill status="running" label="Latest builds" />
        </Panel>
      ) : null}
      <div className="grid gap-6 md:grid-cols-3">
        <Panel className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            Current queue
          </p>
          <p className="text-3xl font-display text-ink">{visibleBuilds.length}</p>
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
      <BuildQueueList jobs={visibleBuilds} />
    </div>
  );
};

export default BuildsPage;

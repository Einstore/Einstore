import BuildQueueList from "../components/BuildQueueList";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import type { ApiBuild } from "../lib/apps";

type BuildsPageProps = {
  builds: ApiBuild[];
  selectedAppName?: string | null;
};

const BuildsPage = ({ builds, selectedAppName }: BuildsPageProps) => {
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
      <Panel className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-ink/50">
            Total builds
          </p>
          <p className="mt-2 text-2xl font-display text-ink">{builds.length}</p>
        </div>
      </Panel>
      <BuildQueueList jobs={builds} />
    </div>
  );
};

export default BuildsPage;

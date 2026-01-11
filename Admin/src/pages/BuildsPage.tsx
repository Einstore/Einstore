import BuildQueueList from "../components/BuildQueueList";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import StatusPill from "../components/StatusPill";
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
      <div className="grid grid-cols-12 gap-6">
        {selectedAppName ? (
          <div className="col-span-12 md:col-span-6 xl:col-span-4">
            <Panel className="flex h-full items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Selected app
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {selectedAppName}
                </p>
              </div>
              <StatusPill status="running" label="Latest builds" />
            </Panel>
          </div>
        ) : null}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <Panel className="flex h-full items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total builds
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {builds.length}
              </p>
            </div>
          </Panel>
        </div>
      </div>
      <BuildQueueList jobs={builds} />
    </div>
  );
};

export default BuildsPage;

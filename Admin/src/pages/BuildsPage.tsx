import BuildQueueList from "../components/BuildQueueList";
import Panel from "../components/Panel";
import type { ApiBuild } from "../lib/apps";

type BuildsPageProps = {
  builds: ApiBuild[];
  buildIcons?: Record<string, string>;
  buildPlatforms?: Record<string, string>;
  onSelectBuild?: (id: string) => void;
};

const BuildsPage = ({ builds, buildIcons, buildPlatforms, onSelectBuild }: BuildsPageProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
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
      <BuildQueueList
        jobs={builds}
        icons={buildIcons}
        platforms={buildPlatforms}
        onSelect={onSelectBuild}
      />
    </div>
  );
};

export default BuildsPage;

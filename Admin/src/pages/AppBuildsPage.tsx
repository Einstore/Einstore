import AppAvatar from "../components/AppAvatar";
import BuildQueueList from "../components/BuildQueueList";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import StatusPill from "../components/StatusPill";
import type { ApiApp, ApiBuild } from "../lib/apps";
import { formatDateTime } from "../lib/apps";

type AppBuildsPageProps = {
  app: ApiApp | null;
  builds: ApiBuild[];
  appIcon?: string | null;
  buildIcons?: Record<string, string>;
  buildPlatforms?: Record<string, string>;
  onSelectBuild?: (id: string) => void;
};

const AppBuildsPage = ({
  app,
  builds,
  appIcon,
  buildIcons,
  buildPlatforms,
  onSelectBuild,
}: AppBuildsPageProps) => {
  const latestBuild = builds[0] ?? null;
  const lastUploaded = latestBuild ? formatDateTime(latestBuild.createdAt) : "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <Panel className="flex h-full items-center gap-4">
            <div className="flex items-center gap-4">
              <AppAvatar name={app?.name ?? latestBuild?.displayName} iconUrl={appIcon} size="lg" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {app?.identifier ?? "App"}
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {app?.name ?? latestBuild?.displayName ?? "App"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Last uploaded {lastUploaded}
                </p>
              </div>
            </div>
          </Panel>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <Panel className="flex h-full items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Latest build
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {latestBuild ? latestBuild.displayName : "—"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Build #{latestBuild?.buildNumber ?? "—"}
              </p>
            </div>
            <StatusPill status="running" label="App builds" />
          </Panel>
        </div>
      </div>

      <SectionHeader title="Builds" />
      <BuildQueueList
        jobs={builds}
        icons={buildIcons}
        platforms={buildPlatforms}
        onSelect={onSelectBuild}
      />
    </div>
  );
};

export default AppBuildsPage;

import AppAvatar from "../AppAvatar";
import Panel from "../Panel";
import StatusPill from "../StatusPill";

type Translate = (key: string, fallback: string, params?: Record<string, string | number>) => string;

type BuildHeaderCardProps = {
  appName: string;
  identifier: string;
  platform: string;
  version: string;
  buildNumber: string;
  iconUrl?: string | null;
  buildId?: string | null;
  canInstall: boolean;
  onInstall?: (buildId: string) => void;
  onDownload?: (buildId: string) => void;
  t: Translate;
};

const BuildHeaderCard = ({
  appName,
  identifier,
  platform,
  version,
  buildNumber,
  iconUrl,
  buildId,
  canInstall,
  onInstall,
  onDownload,
  t,
}: BuildHeaderCardProps) => {
  return (
    <Panel className="col-span-12 md:col-span-4 space-y-4 text-center">
      <div className="mx-auto flex h-28 w-28 items-center justify-center">
        <AppAvatar name={appName} iconUrl={iconUrl} platform={platform} size="lg" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{appName}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{identifier}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <StatusPill
          status="running"
          label={t("build.platformLabel", "Platform: {platform}", { platform })}
        />
        <StatusPill status="running" label={t("build.versionLabel", "Version {version}", { version })} />
        <StatusPill
          status="running"
          label={t("build.numberLabel", "Build {number}", { number: buildNumber })}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {canInstall ? (
          <button
            type="button"
            className="h-10 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500"
            onClick={() => buildId && onInstall?.(buildId)}
            disabled={!buildId}
          >
            {t("build.action.install", "Install")}
          </button>
        ) : null}
        <button
          type="button"
          className="h-10 rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => buildId && onDownload?.(buildId)}
          disabled={!buildId}
        >
          {t("build.action.download", "Download")}
        </button>
      </div>
    </Panel>
  );
};

export default BuildHeaderCard;

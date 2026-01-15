import BuildRow from "./BuildRow";
import type { ApiBuild } from "../lib/apps";
import { formatBytes, formatDateTime } from "../lib/apps";
import type { BuildJob } from "../data/mock";
import { useI18n } from "../lib/i18n";

type BuildQueueListProps = {
  jobs: Array<ApiBuild | (BuildJob & Partial<ApiBuild>)>;
  icons?: Record<string, string>;
  appIcons?: Record<string, string>;
  onSelect?: (id: string) => void;
  platforms?: Record<string, string>;
  onInstall?: (id: string) => void;
  onDownload?: (id: string) => void;
};

const BuildQueueList = ({
  jobs,
  icons,
  appIcons,
  platforms,
  onSelect,
  onInstall,
  onDownload,
}: BuildQueueListProps) => {
  const { t } = useI18n();
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800">
      <div className="-mx-5">
        {jobs.map((job) => {
          const name =
            "displayName" in job && job.displayName ? job.displayName : job.name ?? t("build.fallback", "Build");
          const buildNumber =
            "buildNumber" in job && job.buildNumber
              ? job.buildNumber
              : "branch" in job
                ? job.branch
                : t("common.emptyDash", "—");
          const size = formatBytes("sizeBytes" in job ? job.sizeBytes : undefined);
          const rawDate =
            "createdAt" in job ? job.createdAt : "startedAt" in job ? job.startedAt : "";
          const formattedDate = formatDateTime(rawDate);
          const createdAt = formattedDate === t("common.emptyDash", "—") && rawDate ? rawDate : formattedDate;
        const storageKind = "storageKind" in job ? job.storageKind : undefined;
        const platform = platforms?.[job.id] ?? ("platform" in job ? (job as ApiBuild).platform : undefined);
        const iconUrl =
          icons?.[job.id] ??
          (appIcons && "appId" in job ? appIcons[(job as Partial<ApiBuild>).appId ?? ""] : undefined);

          return (
            <BuildRow
              key={job.id}
              name={name}
              buildNumber={buildNumber}
              size={size}
              createdAt={createdAt}
              storageKind={storageKind}
              iconUrl={iconUrl}
              platform={platform}
              onInstall={onInstall ? () => onInstall(job.id) : undefined}
              onDownload={onDownload ? () => onDownload(job.id) : undefined}
              onSelect={onSelect ? () => onSelect(job.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BuildQueueList;

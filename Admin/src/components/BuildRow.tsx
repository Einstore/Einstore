import AppAvatar from "./AppAvatar";
import { getClientPlatform, shouldShowInstall } from "../lib/device";

export type BuildRowProps = {
  name: string;
  buildNumber: string;
  size: string;
  createdAt: string;
  storageKind?: string | null;
  iconUrl?: string | null;
  platform?: string | null;
  onInstall?: () => void;
  onDownload?: () => void;
  showDownload?: boolean;
  onSelect?: () => void;
};

const BuildRow = ({
  name,
  buildNumber,
  size,
  createdAt,
  storageKind,
  iconUrl,
  platform,
  onInstall,
  onDownload,
  showDownload = true,
  onSelect,
}: BuildRowProps) => {
  const clientPlatform = getClientPlatform();
  const showInstall = shouldShowInstall(platform);
  const showDownloadButton = showDownload || clientPlatform === "web";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-4 text-left text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 last:border-b-0 dark:border-slate-700 dark:hover:bg-slate-700"
    >
      <div className="flex items-center gap-3">
        <AppAvatar name={name} size="sm" iconUrl={iconUrl} platform={platform} />
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{name}</p>
          <p className="text-slate-500 dark:text-slate-400">Build #{buildNumber}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-slate-500 dark:text-slate-400">
          {storageKind ? storageKind.toUpperCase() : "—"}
        </p>
        <p className="text-slate-500 dark:text-slate-400">{size}</p>
        <p className="text-slate-400 dark:text-slate-500">{createdAt}</p>
        <div className="flex items-center gap-2">
          {showInstall ? (
            <span
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
              onClick={(event) => {
                event.stopPropagation();
                onInstall?.();
              }}
            >
              Install
            </span>
          ) : null}
          {showDownloadButton ? (
            <span
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
              onClick={(event) => {
                event.stopPropagation();
                onDownload?.();
              }}
            >
              Download
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
};

export default BuildRow;

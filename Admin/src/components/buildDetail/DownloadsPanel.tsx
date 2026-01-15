import { useEffect, useState } from "react";
import Panel from "../Panel";
import SectionHeader from "../SectionHeader";
import Pagination from "../Pagination";
import { formatDateTime, type ApiBuildEvent } from "../../lib/apps";
import type { PaginationMeta } from "../../lib/pagination";
import { readCookie, writeCookie } from "./cookies";

type Translate = (key: string, fallback: string, params?: Record<string, string | number>) => string;

type DownloadsPanelProps = {
  downloads: ApiBuildEvent[];
  downloadMeta?: PaginationMeta;
  onDownloadPageChange?: (page: number) => void;
  cookiePrefix: string;
  t: Translate;
};

const resolveDeviceLabel = (userAgent: string | null | undefined, t: Translate) => {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return t("device.unknown", "Unknown device");
  if (ua.includes("iphone") || ua.includes("ipod")) return t("device.iphone", "iPhone");
  if (ua.includes("ipad")) return t("device.ipad", "iPad");
  if (ua.includes("android")) {
    return ua.includes("mobile")
      ? t("device.android", "Android")
      : t("device.androidTablet", "Android tablet");
  }
  if (ua.includes("macintosh") || ua.includes("mac os")) return t("device.mac", "Mac");
  if (ua.includes("windows")) return t("device.pc", "PC");
  if (ua.includes("linux")) return t("device.pc", "PC");
  return t("device.unknown", "Unknown device");
};

const DownloadsPanel = ({
  downloads,
  downloadMeta,
  onDownloadPageChange,
  cookiePrefix,
  t,
}: DownloadsPanelProps) => {
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);

  useEffect(() => {
    const open = readCookie(`${cookiePrefix}downloads`);
    setIsDownloadsOpen(open === "1");
  }, [cookiePrefix]);

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={t("build.downloads.title", "Download history")}
          subtitle={t("build.downloads.subtitle", "Newest first")}
        />
        <button
          type="button"
          className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300"
          onClick={() => {
            setIsDownloadsOpen((current) => {
              const next = !current;
              writeCookie(`${cookiePrefix}downloads`, next ? "1" : "0");
              return next;
            });
          }}
        >
          {isDownloadsOpen ? t("common.collapse", "Collapse") : t("common.expand", "Expand")}
        </button>
      </div>
      {isDownloadsOpen ? (
        <>
          {!downloads.length ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("build.downloads.empty", "No downloads recorded for this build yet.")}
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              {downloads.map((event, index) => {
                const isEven = index % 2 === 0;
                const user =
                  event.user?.fullName ||
                  event.user?.username ||
                  event.user?.email ||
                  t("activity.unknownUser", "Unknown user");
                const deviceLabel = resolveDeviceLabel(event.userAgent, t);
                const actionLabel =
                  event.kind === "install"
                    ? t("build.action.install", "Install")
                    : t("build.action.download", "Download");
                return (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${
                      isEven ? "bg-slate-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{user}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {actionLabel} • {deviceLabel}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          {downloadMeta && downloadMeta.total > downloadMeta.perPage ? (
            <Pagination
              page={downloadMeta.page}
              perPage={downloadMeta.perPage}
              totalPages={downloadMeta.totalPages}
              onPageChange={onDownloadPageChange}
            />
          ) : null}
        </>
      ) : null}
    </Panel>
  );
};

export default DownloadsPanel;

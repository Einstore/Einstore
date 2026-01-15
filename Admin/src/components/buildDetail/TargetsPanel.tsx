import { useEffect, useState } from "react";
import Panel from "../Panel";
import SectionHeader from "../SectionHeader";
import type { ApiTarget } from "../../lib/apps";
import MetadataTable from "./MetadataTable";
import { readCookie, writeCookie } from "./cookies";

type Translate = (key: string, fallback: string, params?: Record<string, string | number>) => string;

type TargetsPanelProps = {
  targets?: ApiTarget[];
  cookiePrefix: string;
  t: Translate;
};

const TargetsPanel = ({ targets, cookiePrefix, t }: TargetsPanelProps) => {
  const [isTargetsOpen, setIsTargetsOpen] = useState(false);

  useEffect(() => {
    const open = readCookie(`${cookiePrefix}targets`);
    setIsTargetsOpen(open === "1");
  }, [cookiePrefix]);

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title={t("build.targets.title", "Targets")} />
        <button
          type="button"
          className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300"
          onClick={() => {
            setIsTargetsOpen((current) => {
              const next = !current;
              writeCookie(`${cookiePrefix}targets`, next ? "1" : "0");
              return next;
            });
          }}
        >
          {isTargetsOpen ? t("common.collapse", "Collapse") : t("common.expand", "Expand")}
        </button>
      </div>
      {isTargetsOpen ? (
        !targets?.length ? (
          <p className="text-sm text-slate-500">{t("build.targets.empty", "No targets found for this build.")}</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            {targets.map((target, index) => {
              const isEven = index % 2 === 0;
              return (
                <div
                  key={target.id}
                  className={`grid gap-2 px-4 py-3 text-sm ${
                    isEven ? "bg-slate-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{target.bundleId}</p>
                      <p className="text-xs text-slate-500">
                        {target.platform} • {target.role}
                        {target.minOsVersion
                          ? ` • ${t("build.targets.minOs", "Min OS")} ${target.minOsVersion}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {t("build.targets.badge", "Target")}
                    </span>
                  </div>
                  <MetadataTable metadata={target.metadata} t={t} />
                </div>
              );
            })}
          </div>
        )
      ) : null}
    </Panel>
  );
};

export default TargetsPanel;

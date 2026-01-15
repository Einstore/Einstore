import { useEffect, useMemo, useState } from "react";
import Panel from "../Panel";
import SectionHeader from "../SectionHeader";
import { formatDateTime, type ApiArtifact } from "../../lib/apps";
import MetadataTable from "./MetadataTable";
import { readCookie, writeCookie } from "./cookies";

type Translate = (key: string, fallback: string, params?: Record<string, string | number>) => string;

type ArtifactsPanelProps = {
  artifactsByKind?: Record<string, ApiArtifact[]>;
  cookiePrefix: string;
  t: Translate;
};

const formatKind = (kind: string) => kind.replace(/_/g, " ");

const ArtifactsPanel = ({ artifactsByKind = {}, cookiePrefix, t }: ArtifactsPanelProps) => {
  const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);

  const artifactGroups = useMemo(() => {
    return Object.entries(artifactsByKind).map(([kind, items]) => {
      const unique = (items ?? []).filter(Boolean).reduce<ApiArtifact[]>((acc, current) => {
        const key = `${current.kind}-${current.label ?? ""}-${current.storagePath}`;
        if (!acc.find((item) => `${item.kind}-${item.label ?? ""}-${item.storagePath}` === key)) {
          acc.push(current);
        }
        return acc;
      }, []);
      return [kind, unique] as const;
    });
  }, [artifactsByKind]);

  useEffect(() => {
    const open = readCookie(`${cookiePrefix}artifacts`);
    setIsArtifactsOpen(open === "1");
  }, [cookiePrefix]);

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title={t("build.artifacts.title", "Artifacts & entitlements")} />
        <button
          type="button"
          className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300"
          onClick={() => {
            setIsArtifactsOpen((current) => {
              const next = !current;
              writeCookie(`${cookiePrefix}artifacts`, next ? "1" : "0");
              return next;
            });
          }}
        >
          {isArtifactsOpen ? t("common.collapse", "Collapse") : t("common.expand", "Expand")}
        </button>
      </div>
      {isArtifactsOpen ? (
        !artifactGroups.length ? (
          <p className="text-sm text-slate-500">{t("build.artifacts.empty", "No artifacts available.")}</p>
        ) : (
          <div className="space-y-4">
            {artifactGroups.map(([kind, items]) => {
              if (!items.length) return null;
              return (
                <div key={kind} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {formatKind(kind)}
                  </p>
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    {items.map((item, index) => {
                      const isEven = index % 2 === 0;
                      return (
                        <div
                          key={item.id}
                          className={`grid gap-2 px-4 py-3 text-sm ${
                            isEven ? "bg-slate-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {item.label || formatKind(item.kind)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.storageKind?.toUpperCase?.() ?? t("common.emptyDash", "—")} • {item.storagePath}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500">
                              {item.createdAt ? formatDateTime(item.createdAt) : t("common.emptyDash", "—")}
                            </p>
                          </div>
                          <MetadataTable metadata={item.metadata} t={t} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : null}
    </Panel>
  );
};

export default ArtifactsPanel;

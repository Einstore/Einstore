import Panel from "../Panel";
import SectionHeader from "../SectionHeader";

export type ReleaseDetailRow = {
  label: string;
  value: string | null;
  type: "code" | "link" | "text" | "info";
};

type Translate = (key: string, fallback: string, params?: Record<string, string | number>) => string;

type ReleaseDetailsPanelProps = {
  rows: ReleaseDetailRow[];
  onEdit?: () => void;
  t: Translate;
};

const renderMultilineText = (value: string) =>
  value.split("\n").map((line, index, arr) => (
    <span key={`${line}-${index}`}>
      {line}
      {index < arr.length - 1 ? <br /> : null}
    </span>
  ));

const ReleaseDetailsPanel = ({ rows, onEdit, t }: ReleaseDetailsPanelProps) => {
  return (
    <Panel className="col-span-12 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title={t("build.release.title", "Release details")}
          subtitle={t(
            "build.release.subtitle",
            "Optional metadata that helps connect builds back to code and release notes."
          )}
        />
        {onEdit ? (
          <button
            type="button"
            className="h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={onEdit}
          >
            {t("build.release.edit", "Edit details")}
          </button>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        {rows.map((row, index) => {
          const isEven = index % 2 === 0;
          const value = row.value ?? t("common.emptyDash", "—");
          return (
            <div
              key={`${row.label}-${index}`}
              className={`grid gap-4 px-4 py-3 text-sm md:grid-cols-[220px_1fr] ${
                isEven ? "bg-slate-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {row.label}
              </div>
              <div className="text-sm text-slate-900 dark:text-slate-100">
                {row.type === "link" && row.value ? (
                  <a
                    href={row.value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline transition-colors hover:text-indigo-500 dark:text-indigo-300"
                  >
                    {row.value}
                  </a>
                ) : row.type === "code" && row.value ? (
                  <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
                    {row.value}
                  </code>
                ) : typeof value === "string" ? (
                  <span className="break-words">{renderMultilineText(value)}</span>
                ) : (
                  value
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export default ReleaseDetailsPanel;

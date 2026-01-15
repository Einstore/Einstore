import { infoPlistKeyDescriptionMap } from "../../data/infoPlistKeys";
import { androidManifestKeyDescriptionMap } from "../../data/androidManifestKeys";

const metadataDescriptionMap = {
  ...infoPlistKeyDescriptionMap,
  ...androidManifestKeyDescriptionMap,
};

type Translate = (key: string, fallback: string, params?: Record<string, string | number>) => string;

type MetadataTableProps = {
  metadata: unknown;
  t: Translate;
};

const formatValue = (value: unknown, t: Translate): string => {
  if (value == null) return t("common.emptyDash", "—");
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item, t)).join(", ");
  }
  return Object.entries(value as Record<string, unknown>)
    .map(([key, nested]) => `${key}: ${formatValue(nested, t)}`)
    .join("; ");
};

const toSegments = (value: unknown, t: Translate): string[] => {
  const text = formatValue(value, t);
  if (text.includes(";")) {
    return text
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (text.includes(",")) {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [text];
};

const MetadataTable = ({ metadata, t }: MetadataTableProps) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const entries = Object.entries(metadata as Record<string, unknown>);
  if (!entries.length) return null;

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      {entries.map(([key, value], index) => {
        const isEven = index % 2 === 0;
        const description = metadataDescriptionMap[key]
          ? t(`metadata.${key}`, metadataDescriptionMap[key])
          : null;
        const segments = toSegments(value, t);
        return (
          <div
            key={key}
            className={`grid grid-cols-[1fr_2fr] gap-3 px-3 py-3 text-sm ${
              isEven ? "bg-slate-50 dark:bg-slate-800" : "bg-white dark:bg-slate-900"
            }`}
          >
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{key}</p>
              {description ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
              ) : null}
            </div>
            <div className="space-y-1 break-words text-xs text-slate-700 dark:text-slate-300">
              {segments.map((segment, segmentIndex) => (
                <div
                  key={`${key}-${segmentIndex}`}
                  className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-700/60"
                >
                  {segment || t("common.emptyDash", "—")}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetadataTable;

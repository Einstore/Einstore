import { useEffect, useRef, useState } from "react";
import Panel from "../Panel";
import SectionHeader from "../SectionHeader";
import TagInput from "../TagInput";
import type { ApiTag } from "../../lib/apps";
import { readCookie, writeCookie } from "./cookies";

type Translate = (key: string, fallback: string, params?: Record<string, string | number>) => string;

type TagsPanelProps = {
  tags: ApiTag[];
  availableTags: ApiTag[];
  onChangeTags?: (tags: string[]) => Promise<void> | void;
  cookiePrefix: string;
  onAlert: (message: string | null) => void;
  t: Translate;
};

const tagPaletteClasses: Record<string, string> = {
  bug: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  ok: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  preview: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  tested: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  "needs testing": "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-100",
};

const tagPaletteOrder = ["bug", "ok", "preview", "tested", "needs testing"];

const getTagClassName = (tag: string) =>
  tagPaletteClasses[tag.toLowerCase()] ??
  "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100";

const TagsPanel = ({ tags, availableTags, onChangeTags, cookiePrefix, onAlert, t }: TagsPanelProps) => {
  const [tagDraft, setTagDraft] = useState<string[]>(tags.map((tag) => tag.name));
  const [isTagPaletteOpen, setIsTagPaletteOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const tagLabel = (name: string) => t(`tag.palette.${name.replace(/\s+/g, "_")}`, name);

  useEffect(() => {
    setTagDraft(tags.map((tag) => tag.name));
  }, [tags]);

  useEffect(() => {
    const palette = readCookie(`${cookiePrefix}tagPalette`);
    setIsTagPaletteOpen(palette === "1");
  }, [cookiePrefix]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const notify = (message: string) => {
    onAlert(message);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => onAlert(null), 2000);
  };

  return (
    <Panel className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title={t("build.tags.title", "Tags")}
          subtitle={t(
            "build.tags.subtitle",
            "Tags help you find builds quickly. Add multiple tags; changes save automatically."
          )}
        />
        <button
          type="button"
          className="h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => {
            if (!tagDraft.includes("preview")) {
              const next = [...tagDraft, "preview"];
              setTagDraft(next);
              onChangeTags?.(next);
            }
          }}
        >
          {t("build.tags.makePreview", "Make preview")}
        </button>
      </div>
      <TagInput
        value={tagDraft}
        getTagClassName={getTagClassName}
        onChange={async (next) => {
          setTagDraft(next);
          try {
            await onChangeTags?.(next);
            notify(t("build.tags.saved", "Tags saved"));
          } catch {
            notify(t("build.tags.error", "Could not save tags"));
          }
        }}
        suggestions={availableTags.map((tag) => tag.name)}
        placeholder={t("build.tags.placeholder", "Add a tag (e.g. release, beta, hotfix)")}
      />
      <details
        open={isTagPaletteOpen}
        onToggle={(event) => {
          const open = event.currentTarget.open;
          setIsTagPaletteOpen(open);
          writeCookie(`${cookiePrefix}tagPalette`, open ? "1" : "0");
        }}
        className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/60"
      >
        <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
          {t("build.tags.palette", "Tag palette")}
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {tagPaletteOrder.map((name) => (
            <button
              key={name}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tagPaletteClasses[name]}`}
              onClick={() => {
                const next = Array.from(new Set([...tagDraft, name]));
                setTagDraft(next);
                onChangeTags?.(next);
              }}
            >
              {tagLabel(name)}
            </button>
          ))}
        </div>
      </details>
    </Panel>
  );
};

export default TagsPanel;

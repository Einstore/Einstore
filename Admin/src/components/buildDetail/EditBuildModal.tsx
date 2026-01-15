import { useEffect, useState } from "react";
import Panel from "../Panel";
import type { ApiBuildMetadata, BuildMetadataUpdateInput } from "../../lib/apps";

type Translate = (key: string, fallback: string, params?: Record<string, string | number>) => string;

type EditBuildModalProps = {
  isOpen: boolean;
  build: ApiBuildMetadata | null;
  onClose: () => void;
  onUpdateMetadata?: (updates: BuildMetadataUpdateInput) => Promise<ApiBuildMetadata | null | void>;
  t: Translate;
};

type EditFormState = {
  gitCommit: string;
  prUrl: string;
  changeLog: string;
  notes: string;
  infoText: string;
};

const EditBuildModal = ({ isOpen, build, onClose, onUpdateMetadata, t }: EditBuildModalProps) => {
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    gitCommit: "",
    prUrl: "",
    changeLog: "",
    notes: "",
    infoText: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    setEditForm({
      gitCommit: build?.gitCommit ?? "",
      prUrl: build?.prUrl ?? "",
      changeLog: build?.changeLog ?? "",
      notes: build?.notes ?? "",
      infoText:
        build?.info && typeof build.info === "object" && !Array.isArray(build.info)
          ? JSON.stringify(build.info, null, 2)
          : "",
    });
    setEditError("");
  }, [isOpen, build]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Panel className="w-full max-w-3xl space-y-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t("build.edit.title", "Edit build details")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t(
                "build.edit.subtitle",
                "Link this build back to source control and release notes. Empty fields will be cleared."
              )}
            </p>
          </div>
          <button
            type="button"
            className="text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={() => {
              onClose();
              setEditError("");
            }}
            aria-label={t("common.close", "Close")}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("build.release.gitCommit", "Git commit")}
            </span>
            <input
              type="text"
              value={editForm.gitCommit}
              onChange={(event) =>
                setEditForm((current) => ({ ...current, gitCommit: event.target.value }))
              }
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder={t("build.edit.gitCommit.placeholder", "e.g. 9fceb02")}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("build.release.prLink", "PR link")}
            </span>
            <input
              type="url"
              value={editForm.prUrl}
              onChange={(event) => setEditForm((current) => ({ ...current, prUrl: event.target.value }))}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder={t("build.edit.prLink.placeholder", "https://github.com/org/repo/pull/123")}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("build.release.changeLog", "Change log")}
            </span>
            <textarea
              value={editForm.changeLog}
              onChange={(event) =>
                setEditForm((current) => ({ ...current, changeLog: event.target.value }))
              }
              className="min-h-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder={t("build.edit.changeLog.placeholder", "What changed in this build?")}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("build.release.notes", "Notes")}
            </span>
            <textarea
              value={editForm.notes}
              onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder={t("build.edit.notes.placeholder", "Tester notes, install instructions, etc.")}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("build.edit.info.label", "Info (JSON)")}
          </span>
          <textarea
            value={editForm.infoText}
            onChange={(event) => setEditForm((current) => ({ ...current, infoText: event.target.value }))}
            className="min-h-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            placeholder={t("build.edit.info.placeholder", '{"qaOwner":"Alex","jira":"MOBILE-123"}')}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t(
              "build.edit.info.help",
              "Provide a JSON object for any extra metadata (e.g., QA owner, links, environment flags)."
            )}
          </p>
        </label>

        {editError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-900/30 dark:text-rose-200">
            {editError}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => {
              onClose();
              setEditError("");
            }}
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="button"
            className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
            disabled={isSavingEdit}
            onClick={async () => {
              if (!onUpdateMetadata || !build?.id) return;
              setIsSavingEdit(true);
              setEditError("");
              try {
                let parsedInfo: Record<string, unknown> | null | undefined = undefined;
                const infoText = editForm.infoText.trim();
                if (infoText) {
                  const parsed = JSON.parse(infoText);
                  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                    throw new Error(t("build.edit.info.error", "Info must be a JSON object."));
                  }
                  parsedInfo = parsed as Record<string, unknown>;
                } else {
                  parsedInfo = null;
                }
                const payload: BuildMetadataUpdateInput = {
                  gitCommit: editForm.gitCommit.trim() || null,
                  prUrl: editForm.prUrl.trim() || null,
                  changeLog: editForm.changeLog.trim() || null,
                  notes: editForm.notes.trim() || null,
                  info: parsedInfo,
                };
                await onUpdateMetadata(payload);
                onClose();
              } catch (err) {
                setEditError(
                  err instanceof Error
                    ? err.message
                    : t("build.edit.error.save", "Unable to save changes.")
                );
              } finally {
                setIsSavingEdit(false);
              }
            }}
          >
            {t("common.saveChanges", "Save changes")}
          </button>
        </div>
      </Panel>
    </div>
  );
};

export default EditBuildModal;

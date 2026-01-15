import { FormEvent, useMemo, useState } from "react";
import type { ApiComment } from "../lib/comments";
import { useI18n } from "../lib/i18n";
import Panel from "./Panel";

export type CommentsPanelProps = {
  comments: ApiComment[];
  currentUserId?: string | null;
  onSubmit?: (text: string) => Promise<void> | void;
  isSubmitting?: boolean;
  isLoading?: boolean;
  error?: string | null;
};

const CommentAvatar = ({ label }: { label: string }) => {
  const initial = label.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
      {initial}
    </span>
  );
};

const formatDate = (value: string | undefined, locale: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const CommentsPanel = ({ comments, currentUserId, onSubmit, isSubmitting, isLoading, error }: CommentsPanelProps) => {
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!onSubmit) return;
    const text = draft.trim();
    if (!text) {
      setLocalError(t("comments.error.empty", "Comment cannot be empty."));
      return;
    }
    setLocalError("");
    try {
      await onSubmit(text);
      setDraft("");
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : t("comments.error.submit", "Unable to post comment.")
      );
    }
  };

  const sortedComments = useMemo(() => comments ?? [], [comments]);

  return (
    <Panel className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("comments.title", "Comments")}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("comments.subtitle", "Share release notes, test results, or quick context.")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-h-[96px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder={t("comments.placeholder", "Add a comment")}
          disabled={isSubmitting}
        />
        {localError || error ? (
          <p className="text-xs text-rose-600 dark:text-rose-300">{localError || error}</p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {t("comments.submit", "Post comment")}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-slate-500">{t("comments.loading", "Loading comments…")}</p>
        ) : null}
        {!isLoading && !sortedComments.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("comments.empty", "No comments yet.")}
          </p>
        ) : null}
        {sortedComments.map((comment) => {
          const authorName =
            comment.user?.fullName || comment.user?.username || comment.user?.email || t("common.unknown", "Unknown");
          const isMine = comment.userId && currentUserId && comment.userId === currentUserId;
          const bubbleClasses = isMine
            ? "bg-indigo-50 text-slate-800 dark:bg-indigo-900/30 dark:text-slate-100"
            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
          const alignment = isMine ? "items-end" : "items-start";
          const textAlign = isMine ? "text-right" : "text-left";
          return (
            <div key={comment.id} className={`flex ${alignment} gap-3`}>
              {!isMine ? <CommentAvatar label={authorName} /> : <div className="w-9" />}
              <div className="max-w-[80%] space-y-1">
                <div className={`flex items-center justify-between gap-3 ${textAlign}`}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{authorName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(comment.createdAt, locale)}
                  </p>
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${bubbleClasses}`}>
                  {comment.text}
                </div>
              </div>
              {isMine ? <CommentAvatar label={authorName} /> : <div className="w-9" />}
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export default CommentsPanel;

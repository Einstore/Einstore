import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";

const allowedExtensions = [".ipa", ".apk"];

const isValidFile = (file: File | null) => {
  if (!file) return false;
  const lower = file.name.toLowerCase();
  return allowedExtensions.some((ext) => lower.endsWith(ext));
};

type BuildUploadDropzoneProps = {
  onUpload: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  variant: "compact" | "full";
  title?: string;
};

const BuildUploadDropzone = ({
  onUpload,
  variant,
  title,
}: BuildUploadDropzoneProps) => {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const resolvedTitle = title ?? t("upload.title.default", "Upload your first build here");

  useEffect(() => {
    if (!status || busy) return undefined;
    const timer = window.setTimeout(() => setStatus(""), 1800);
    return () => window.clearTimeout(timer);
  }, [busy, status]);

  const handleFile = async (file: File | null) => {
    if (!file || !isValidFile(file) || busy) return;
    setBusy(true);
    setError("");
    setStatus(t("upload.status.uploading", "Uploading build..."));
    setProgress(0);
    try {
      await onUpload(file, (value) => {
        const nextValue = Math.min(Math.max(value, 0), 1);
        setProgress(nextValue);
        setStatus(
          t("upload.status.progress", "Uploading build... {percent}%", {
            percent: Math.round(nextValue * 100),
          })
        );
      });
      setStatus(t("upload.status.complete", "Upload complete"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("upload.error.failed", "Upload failed."));
      setStatus("");
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (file && !isValidFile(file)) {
      setError(t("upload.error.fileType", "Only .ipa or .apk files are supported."));
      return;
    }
    void handleFile(file);
  };

  const handlePick = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  const baseClasses =
    variant === "full"
      ? "flex min-h-[320px] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed text-center transition-colors"
      : "group relative flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  const stateClasses = busy
    ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-300/60 dark:bg-indigo-500/10 dark:text-indigo-200"
    : isDragging
      ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-300/60 dark:bg-indigo-500/10 dark:text-indigo-200"
      : variant === "full"
        ? "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${variant === "compact" ? "hidden md:block " : ""}${baseClasses} ${stateClasses}`}
      onClick={handlePick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handlePick();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      {variant === "compact" ? (
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
            UP
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t("upload.compact.title", "Upload build")}
            </p>
            <p className="text-xs text-slate-500">
              {t("upload.compact.help", "Drop IPA/APK or click to browse. Uploads immediately.")}
            </p>
            {progress !== null ? (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-[width] duration-150"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                  {Math.round(progress * 100)}%
                </p>
              </div>
            ) : null}
            {status ? <p className="mt-1 text-xs text-indigo-600">{status}</p> : null}
            {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{resolvedTitle}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("upload.full.help", "Drop an IPA/APK file or browse to upload.")}
            </p>
          </div>
          <button
            type="button"
            className="h-11 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            onClick={(event) => {
              event.stopPropagation();
              handlePick();
            }}
            disabled={busy}
          >
            {t("common.browse", "Browse")}
          </button>
          {progress !== null ? (
            <div className="w-full max-w-sm space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-[width] duration-150"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="text-right text-xs text-slate-500 dark:text-slate-400">
                {Math.round(progress * 100)}%
              </p>
            </div>
          ) : null}
          {status ? <p className="text-xs text-indigo-600">{status}</p> : null}
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".ipa,.apk"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
};

export default BuildUploadDropzone;

import { useEffect, useRef, useState } from "react";

const allowedExtensions = [".ipa", ".apk"];

const isValidFile = (file: File | null) => {
  if (!file) return false;
  const lower = file.name.toLowerCase();
  return allowedExtensions.some((ext) => lower.endsWith(ext));
};

type EmptyUploadDropzoneProps = {
  onUpload: (file: File) => Promise<void>;
  title?: string;
};

const EmptyUploadDropzone = ({
  onUpload,
  title = "Upload your first build here",
}: EmptyUploadDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!status) return undefined;
    const timer = window.setTimeout(() => setStatus(""), 1800);
    return () => window.clearTimeout(timer);
  }, [status]);

  const handleFile = async (file: File | null) => {
    if (!file || !isValidFile(file) || busy) return;
    setBusy(true);
    setError("");
    setStatus("Uploading build…");
    try {
      await onUpload(file);
      setStatus("Upload complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setStatus("");
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (file && !isValidFile(file)) {
      setError("Only .ipa or .apk files are supported.");
      return;
    }
    void handleFile(file);
  };

  const handlePick = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  const baseClasses =
    "flex min-h-[320px] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed text-center transition-colors";
  const stateClasses = busy
    ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-300/60 dark:bg-indigo-500/10 dark:text-indigo-200"
    : isDragging
      ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-300/60 dark:bg-indigo-500/10 dark:text-indigo-200"
      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${baseClasses} ${stateClasses}`}
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
      <div className="space-y-2">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Drop an IPA/APK file or browse to upload.
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
        Browse
      </button>
      {status ? <p className="text-xs text-indigo-600">{status}</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
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

export default EmptyUploadDropzone;

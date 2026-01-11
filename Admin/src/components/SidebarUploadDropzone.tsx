import { useEffect, useRef, useState } from "react";

const allowedExtensions = [".ipa", ".apk"];

const isValidFile = (file: File | null) => {
  if (!file) return false;
  const lower = file.name.toLowerCase();
  return allowedExtensions.some((ext) => lower.endsWith(ext));
};

const SidebarUploadDropzone = ({ onUpload }: { onUpload: (file: File) => Promise<void> }) => {
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
    "group relative flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  const stateClasses = busy
    ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-300/60 dark:bg-indigo-500/10 dark:text-indigo-200"
    : isDragging
      ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-300/60 dark:bg-indigo-500/10 dark:text-indigo-200"
      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div
      role="button"
      tabIndex={0}
      className={`hidden md:block ${baseClasses} ${stateClasses}`}
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
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
          UP
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upload build</p>
          <p className="text-xs text-slate-500">
            Drop IPA/APK or click to browse. Uploads immediately.
          </p>
          {status ? <p className="mt-1 text-xs text-indigo-600">{status}</p> : null}
          {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
        </div>
      </div>
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

export default SidebarUploadDropzone;

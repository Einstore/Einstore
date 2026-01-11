import { useRef, useState } from "react";

import ActionButton from "./ActionButton";

const allowedExtensions = [".ipa", ".apk"];

const formatFile = (file: File | null) => {
  if (!file) {
    return "No file selected";
  }
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  return `${file.name} (${sizeMb} MB)`;
};

type FileDropzoneProps = {
  label: string;
  helper?: string;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  statusMessage?: string;
};

const FileDropzone = ({
  label,
  helper,
  onFileSelect,
  disabled,
  statusMessage,
}: FileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleFiles = (files: FileList | null) => {
    if (disabled) {
      return;
    }
    const selected = files?.[0] ?? null;
    if (selected) {
      const lower = selected.name.toLowerCase();
      const isAllowed = allowedExtensions.some((ext) => lower.endsWith(ext));
      if (!isAllowed) {
        setError("Only .ipa or .apk files are supported.");
        setFile(null);
        onFileSelect(null);
        return;
      }
    }
    setError("");
    setFile(selected);
    onFileSelect(selected);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {helper ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">{helper}</p>
        ) : null}
      </div>
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm transition-colors dark:border-slate-700 dark:bg-slate-800 ${
          isDragging ? "bg-slate-50 dark:bg-slate-700" : ""
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        onDragEnter={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <p className="text-slate-600 dark:text-slate-300">Drop IPA or APK here</p>
        <ActionButton
          label="Browse file"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {formatFile(file)}
        </p>
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
        {statusMessage ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {statusMessage}
          </p>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept=".ipa,.apk"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
    </div>
  );
};

export default FileDropzone;

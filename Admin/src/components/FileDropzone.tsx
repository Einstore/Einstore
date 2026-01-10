import { useRef, useState } from "react";

import ActionButton from "./ActionButton";

const allowedExtensions = [".ipa", ".apk", ".aab"];

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
};

const FileDropzone = ({ label, helper, onFileSelect }: FileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0] ?? null;
    if (selected) {
      const lower = selected.name.toLowerCase();
      const isAllowed = allowedExtensions.some((ext) => lower.endsWith(ext));
      if (!isAllowed) {
        setError("Only .ipa, .apk, or .aab files are supported.");
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
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">
          {label}
        </p>
        {helper ? <p className="text-xs text-ink/50">{helper}</p> : null}
      </div>
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-6 text-sm transition ${
          isDragging
            ? "border-ink bg-ink/5"
            : "border-ink/20 bg-white/70"
        }`}
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
        <p className="text-ink/70">Drop IPA, APK, or AAB here</p>
        <ActionButton
          label="Browse file"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        />
        <p className="text-xs text-ink/50">{formatFile(file)}</p>
        {error ? <p className="text-xs text-coral">{error}</p> : null}
        <input
          ref={inputRef}
          type="file"
          accept=".ipa,.apk,.aab"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
    </div>
  );
};

export default FileDropzone;

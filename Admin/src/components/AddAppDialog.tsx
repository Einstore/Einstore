import { useEffect, useState } from "react";

import ActionButton from "./ActionButton";
import FileDropzone from "./FileDropzone";
import Panel from "./Panel";

const AddAppDialog = ({
  isOpen,
  onClose,
  onUpload,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setStatus("");
      setError("");
      setBusy(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 150);
  };

  const overlayOpacity = isClosing ? "opacity-0" : "opacity-100";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 transition-opacity duration-150 ${overlayOpacity}`}
      onClick={handleClose}
    >
      <Panel
        className="w-full max-w-lg space-y-6 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Upload build
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Upload an IPA or APK to start ingestion. App details will be read from the manifest.
          </p>
        </div>
        <FileDropzone
          label="App binary"
          helper="Drop a file or browse from your machine."
          onFileSelect={setFile}
          disabled={busy}
          statusMessage={status || undefined}
        />
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton label="Cancel" variant="outline" onClick={handleClose} />
          <ActionButton
            label="Upload build"
            variant="primary"
            disabled={!file || busy}
            onClick={async () => {
              if (!file || busy) {
                return;
              }
              setBusy(true);
              setError("");
              setStatus("Uploading build...");
              try {
                await onUpload(file);
                setStatus("Build ingested.");
                setFile(null);
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed.");
                setStatus("");
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      </Panel>
    </div>
  );
};

export default AddAppDialog;

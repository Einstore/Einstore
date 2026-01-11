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

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setStatus("");
      setError("");
      setBusy(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <Panel className="w-full max-w-xl space-y-6">
        <div>
          <h3 className="text-2xl font-display text-ink">Add app build</h3>
          <p className="mt-2 text-sm text-ink/60">
            Upload an IPA, APK, or AAB to start ingestion. App details will be read from the manifest.
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
          <p className="rounded-2xl border border-coral/40 bg-coral/10 p-3 text-xs text-coral">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton label="Cancel" variant="outline" onClick={onClose} />
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

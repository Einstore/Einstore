import { useEffect, useState } from "react";

import ActionButton from "./ActionButton";
import FileDropzone from "./FileDropzone";
import Panel from "./Panel";
import { useI18n } from "../lib/i18n";

const AddAppDialog = ({
  isOpen,
  onClose,
  onUpload,
  debugInfo,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  debugInfo?: string;
}) => {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setStatus("");
      setError("");
      setBusy(false);
      setIsClosing(false);
      setProgress(null);
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
      onMouseDown={(event) => {
        // Only close when the actual overlay is clicked; ignore clicks inside the dialog or during upload
        if (event.target !== event.currentTarget || busy) return;
        handleClose();
      }}
    >
      <Panel
        className="w-full max-w-lg space-y-6 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("upload.dialog.title", "Upload build")}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "upload.dialog.subtitle",
              "Upload an IPA or APK to start ingestion. App details will be read from the manifest."
            )}
          </p>
        </div>
        <FileDropzone
          label={t("upload.dialog.label", "App binary")}
          helper={t("upload.dialog.helper", "Drop a file or browse from your machine.")}
          onFileSelect={setFile}
          disabled={busy}
          statusMessage={status || undefined}
        />
        {progress !== null ? (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </p>
        ) : null}
        {debugInfo ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <p className="font-semibold">{t("upload.dialog.debug", "Debug info")}</p>
            <p className="mt-1 break-all font-mono">{debugInfo}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton label={t("common.cancel", "Cancel")} variant="outline" onClick={handleClose} />
          <ActionButton
            label={t("upload.dialog.cta", "Upload build")}
            variant="primary"
            disabled={!file || busy}
            onClick={async () => {
              if (!file || busy) {
                return;
              }
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
                setStatus(t("upload.status.ingested", "Build ingested."));
                setFile(null);
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : t("upload.error.failed", "Upload failed."));
                setStatus("");
              } finally {
                setBusy(false);
                setProgress(null);
              }
            }}
          />
        </div>
      </Panel>
    </div>
  );
};

export default AddAppDialog;

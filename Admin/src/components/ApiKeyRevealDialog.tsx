import ActionButton from "./ActionButton";
import Panel from "./Panel";

type ApiKeyRevealDialogProps = {
  isOpen: boolean;
  token: string | null;
  onCopy: () => void;
  onClose: () => void;
};

const ApiKeyRevealDialog = ({
  isOpen,
  token,
  onCopy,
  onClose,
}: ApiKeyRevealDialogProps) => {
  if (!isOpen || !token) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Panel className="w-full max-w-lg space-y-4 p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Copy your new API key
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            This key will only be shown once. Store it securely.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
          <span className="break-all font-mono">{token}</span>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton label="Copy" variant="outline" onClick={onCopy} />
          <ActionButton label="I saved it" variant="primary" onClick={onClose} />
        </div>
      </Panel>
    </div>
  );
};

export default ApiKeyRevealDialog;

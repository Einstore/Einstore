import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ActionButton from "./ActionButton";
import Panel from "./Panel";
import { buildInviteAcceptPath, extractInviteToken } from "../lib/invites";
import { useI18n } from "../lib/i18n";

type AcceptInviteDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AcceptInviteDialog = ({ isOpen, onClose }: AcceptInviteDialogProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setInput("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleGo = () => {
    const token = extractInviteToken(input);
    if (!token) {
      setError(t("invite.accept.error.missing", "Enter an invite link or token."));
      return;
    }
    setError("");
    navigate(buildInviteAcceptPath(token));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Panel className="w-full max-w-lg space-y-6 p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("invite.accept.title", "Accept invitation")}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "invite.accept.subtitle",
              "Paste an invite link to join a team. You may need to sign in first."
            )}
          </p>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="accept-invite-input"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            {t("invite.accept.label", "Invitation link")}
          </label>
          <input
            id="accept-invite-input"
            type="url"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t(
              "invite.accept.placeholder",
              "https://admin.local.einstore.pro/accept-invite?token=..."
            )}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton label={t("common.cancel", "Cancel")} variant="outline" onClick={onClose} />
          <ActionButton label={t("common.continue", "Continue")} variant="primary" onClick={handleGo} />
        </div>
      </Panel>
    </div>
  );
};

export default AcceptInviteDialog;

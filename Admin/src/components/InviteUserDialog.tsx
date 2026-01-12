import { useEffect, useState } from "react";

import ActionButton from "./ActionButton";
import Panel from "./Panel";
import { apiFetch } from "../lib/api";
import { buildInviteAcceptPath } from "../lib/invites";

type InviteUserDialogProps = {
  isOpen: boolean;
  teamId: string;
  onClose: () => void;
};

const InviteUserDialog = ({ isOpen, teamId, onClose }: InviteUserDialogProps) => {
  const [maxUses, setMaxUses] = useState<number>(1);
  const [domain, setDomain] = useState("");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMaxUses(1);
      setDomain("");
      setLink("");
      setMessage("");
      setError("");
      setBusy(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const buildLink = (path: string, token?: string) => {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    if (token) {
      return `${window.location.origin}${buildInviteAcceptPath(token)}`;
    }
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const generate = async () => {
    if (!teamId) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const payload = await apiFetch<{
        invite?: { path?: string; token: string; allowedDomain?: string | null };
      }>(`/teams/${teamId}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-team-id": teamId,
        },
        body: JSON.stringify({
          maxUses: Number.isFinite(maxUses) ? Math.max(0, Math.floor(maxUses)) : 0,
          allowedDomain: domain.trim() || undefined,
        }),
      });
      const invitePath = payload?.invite?.path || buildInviteAcceptPath(payload?.invite?.token ?? "");
      const fullLink = buildLink(invitePath, payload?.invite?.token);
      setLink(fullLink);
      setMessage("Invite link generated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create invite.");
      setLink("");
    } finally {
      setBusy(false);
    }
  };

  const canCopy = Boolean(link);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Panel className="w-full max-w-xl space-y-6 p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Invite user
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Generate a shareable link. Set max uses (0 = unlimited) or restrict to an email
            domain.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="invite-max-uses"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            Max uses
          </label>
          <input
            id="invite-max-uses"
            type="number"
            min={0}
            value={maxUses}
            onChange={(event) => setMaxUses(Number(event.target.value) || 0)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use 0 for unlimited. The link can also be restricted to a domain below.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="invite-domain"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            Restrict to email domain
          </label>
          <input
            id="invite-domain"
            type="text"
            placeholder="example.com"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Optional. Only users with matching email domains can accept.
          </p>
        </div>

        {link ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Invite link
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                className="h-11 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                disabled={!canCopy}
                onClick={async () => {
                  if (!canCopy) return;
                  await navigator.clipboard.writeText(link);
                  setMessage("Copied to clipboard.");
                }}
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Copy
              </button>
            </div>
          </div>
        ) : null}

        {message ? (
          <p className="text-xs text-green-600" aria-live="polite">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton label="Close" variant="outline" onClick={onClose} />
          <ActionButton
            label={link ? "Regenerate" : "Generate link"}
            variant="primary"
            disabled={busy}
            onClick={generate}
          />
        </div>
      </Panel>
    </div>
  );
};

export default InviteUserDialog;

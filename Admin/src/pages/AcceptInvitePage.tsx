import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import ActionButton from "../components/ActionButton";
import Panel from "../components/Panel";
import { apiFetch } from "../lib/api";
import { buildInviteAcceptPath, extractInviteToken } from "../lib/invites";
import { useI18n } from "../lib/i18n";

type InviteSummary = {
  teamId: string;
  teamName: string;
  allowedDomain?: string | null;
  maxUses?: number | null;
  remainingUses?: number | null;
};

const AcceptInvitePage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invite, setInvite] = useState<InviteSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const tokenParam = searchParams.get("token") || "";
  const token = extractInviteToken(tokenParam);

  useEffect(() => {
    if (!token) {
      setInvite(null);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError("");
    apiFetch<{ invite: InviteSummary }>(`/invites/${encodeURIComponent(token)}`)
      .then((payload) => {
        if (!isMounted) return;
        if (payload?.invite) {
          setInvite(payload.invite);
        } else {
          setInvite(null);
          setError(t("invite.accept.error.notFound", "Invitation not found."));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setInvite(null);
        setError(err instanceof Error ? err.message : t("invite.accept.error.load", "Unable to load invitation."));
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const payload = await apiFetch<{ teamId: string; teamName?: string }>(
        `/invites/${encodeURIComponent(token)}/accept`,
        { method: "POST" }
      );
      if (payload?.teamId) {
        localStorage.setItem("pendingActiveTeamId", payload.teamId);
      }
      navigate("/overview", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("invite.accept.error.accept", "Unable to accept invitation."));
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = () => {
    navigate("/overview", { replace: true });
  };

  const title = invite?.teamName
    ? t("invite.accept.titleWithTeam", "Accept invitation to {team}", { team: invite.teamName })
    : t("invite.accept.title", "Accept invitation");
  const remaining = invite
    ? invite.maxUses === 0
      ? t("invite.accept.usage.unlimited", "Unlimited uses")
      : t("invite.accept.usage.remaining", "{count} remaining", {
          count: invite.remainingUses ?? invite.maxUses ?? 0,
        })
    : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t("invite.accept.heading", "Invitation")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t(
            "invite.accept.description",
            "Paste an invite link or use the one in the address bar to join a team."
          )}
        </p>
      </div>
      <Panel className="space-y-4 p-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("invite.accept.label", "Invitation link")}
          </label>
          <input
            type="url"
            value={token ? buildInviteAcceptPath(token) : ""}
            onChange={(event) => {
              const value = event.target.value;
              const nextToken = extractInviteToken(value);
              const path = buildInviteAcceptPath(nextToken);
              navigate(path, { replace: true });
            }}
            placeholder={t(
              "invite.accept.placeholder",
              "https://admin.local.einstore.pro/accept-invite?token=..."
            )}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {remaining ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{remaining}</p>
          ) : null}
          {invite?.allowedDomain ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("invite.accept.domainPrefix", "Only emails from")}{" "}
              <span className="font-semibold">{invite.allowedDomain}</span>{" "}
              {t("invite.accept.domainSuffix", "can use this link.")}
            </p>
          ) : null}
        </div>
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("invite.accept.loading", "Checking invitation…")}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton label={t("invite.accept.decline", "Decline")} variant="outline" onClick={handleDecline} />
          <ActionButton
            label={t("invite.accept.cta", "Accept")}
            variant="primary"
            disabled={!token || loading || busy || Boolean(error)}
            onClick={handleAccept}
          />
        </div>
      </Panel>
    </div>
  );
};

export default AcceptInvitePage;

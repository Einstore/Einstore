import { useMemo, useState } from "react";
import type { TeamMember, TeamRole } from "../lib/teams";
import { useI18n } from "../lib/i18n";
import { apiFetch } from "../lib/api";

type TeamMembersTableProps = {
  members: TeamMember[];
  teamId?: string;
  currentUserRole?: TeamRole | null;
  onUpdated?: () => void;
};

const TeamMembersTable = ({
  members,
  teamId,
  currentUserRole,
  onUpdated,
}: TeamMembersTableProps) => {
  const { t } = useI18n();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingRoles, setPendingRoles] = useState<Record<string, TeamRole>>({});

  const canManageRoles = currentUserRole === "owner" || currentUserRole === "admin";
  const roleOptions = useMemo(() => {
    if (currentUserRole === "owner") return ["owner", "admin", "member"] as TeamRole[];
    if (currentUserRole === "admin") return ["admin", "member"] as TeamRole[];
    return ["member"] as TeamRole[];
  }, [currentUserRole]);

  const roleLabel = (role: TeamMember["role"]) => {
    if (role === "owner") {
      return t("team.role.owner", "Owner");
    }
    if (role === "admin") {
      return t("team.role.admin", "Admin");
    }
    return t("team.role.user", "User");
  };

  const handleRoleChange = async (member: TeamMember, nextRole: TeamRole) => {
    if (!teamId || !canManageRoles || member.role === nextRole) {
      return;
    }
    setSavingId(member.id);
    setError("");
    setPendingRoles((current) => ({ ...current, [member.id]: nextRole }));
    try {
      await apiFetch(`/teams/${teamId}/users/${member.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-team-id": teamId,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      onUpdated?.();
    } catch {
      setError(t("team.role.updateError", "Unable to update role."));
      setPendingRoles((current) => {
        const { [member.id]: _removed, ...rest } = current;
        return rest;
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 border-b border-slate-200 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <span>{t("team.members.name", "Name")}</span>
        <span>{t("team.members.email", "Email")}</span>
        <span>{t("team.members.role", "Role")}</span>
      </div>
      <div>
        {members.map((member) => (
          <div
            key={member.id}
            className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 border-b border-slate-200 py-4 text-sm last:border-b-0 dark:border-slate-700"
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {member.name}
            </div>
            <div className="text-slate-500 dark:text-slate-400">{member.email}</div>
            <div className="text-slate-500 dark:text-slate-400">
              {canManageRoles ? (
                <div>
                  <label htmlFor={`role-${member.id}`} className="sr-only">
                    {t("team.members.role", "Role")}
                  </label>
                  <select
                    id={`role-${member.id}`}
                    value={pendingRoles[member.id] ?? member.role}
                    disabled={
                      !teamId ||
                      savingId === member.id ||
                      (member.role === "owner" && currentUserRole !== "owner")
                    }
                    onChange={(event) =>
                      handleRoleChange(member, event.target.value as TeamRole)
                    }
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel(role)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                roleLabel(member.role)
              )}
            </div>
          </div>
        ))}
      </div>
      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default TeamMembersTable;

import type { TeamMember } from "../lib/teams";

const roleLabel = (role: TeamMember["role"]) => {
  if (role === "owner") {
    return "Owner";
  }
  if (role === "admin") {
    return "Admin";
  }
  return "User";
};

const TeamMembersTable = ({ members }: { members: TeamMember[] }) => {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 border-b border-slate-200 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
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
            <div className="text-slate-500 dark:text-slate-400">{roleLabel(member.role)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMembersTable;

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
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 border-b border-ink/5 pb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
      </div>
      <div>
        {members.map((member) => (
          <div
            key={member.id}
            className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 border-b border-ink/5 py-4 text-sm last:border-b-0"
          >
            <div className="font-semibold text-ink">{member.name}</div>
            <div className="text-ink/60">{member.email}</div>
            <div className="text-ink/60">{roleLabel(member.role)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMembersTable;

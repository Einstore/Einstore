import type { TeamMember } from "../data/mock";

const TeamMembersTable = ({ members }: { members: TeamMember[] }) => {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-float backdrop-blur">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 border-b border-ink/10 pb-3 text-xs font-semibold uppercase tracking-wide text-ink/50">
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
      </div>
      <div>
        {members.map((member) => (
          <div
            key={member.id}
            className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 border-b border-ink/10 py-4 text-sm last:border-b-0"
          >
            <div className="font-semibold text-ink">{member.name}</div>
            <div className="text-ink/60">{member.email}</div>
            <div className="text-ink/60">{member.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMembersTable;

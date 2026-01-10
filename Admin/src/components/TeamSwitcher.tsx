import type { Team } from "../data/mock";

const TeamSwitcher = ({
  teams,
  activeTeamId,
  onChange,
}: {
  teams: Team[];
  activeTeamId: string;
  onChange: (teamId: string) => void;
}) => {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">
        Team
      </p>
      <select
        value={activeTeamId}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-ink/15 bg-white/80 px-4 text-sm text-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TeamSwitcher;

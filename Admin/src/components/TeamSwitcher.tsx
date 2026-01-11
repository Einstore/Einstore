import type { TeamSummary } from "../lib/teams";

const TeamSwitcher = ({
  teams,
  activeTeamId,
  onChange,
}: {
  teams: TeamSummary[];
  activeTeamId: string;
  onChange: (teamId: string) => void;
}) => {
  const hasTeams = teams.length > 0;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">
        Team
      </p>
      <select
        value={activeTeamId}
        onChange={(event) => onChange(event.target.value)}
        disabled={!hasTeams}
        className="h-11 w-full rounded-xl bg-white px-4 text-sm text-ink shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:opacity-60"
      >
        {hasTeams ? (
          teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))
        ) : (
          <option value="">No teams yet</option>
        )}
      </select>
    </div>
  );
};

export default TeamSwitcher;

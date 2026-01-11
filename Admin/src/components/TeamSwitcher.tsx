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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Team
      </p>
      <select
        value={activeTeamId}
        onChange={(event) => onChange(event.target.value)}
        disabled={!hasTeams}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700"
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

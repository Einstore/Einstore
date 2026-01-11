import { useEffect, useMemo, useRef, useState } from "react";

import type { TeamSummary } from "../lib/teams";
import Icon from "./Icon";

const TeamSwitcher = ({
  teams,
  activeTeamId,
  onChange,
  onCreateTeam,
}: {
  teams: TeamSummary[];
  activeTeamId: string;
  onChange: (teamId: string) => void;
  onCreateTeam?: (name: string) => Promise<void>;
}) => {
  const hasTeams = teams.length > 0;
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) ?? teams[0] ?? null,
    [teams, activeTeamId]
  );

  const initials = useMemo(() => {
    if (!activeTeam?.name) return "E";
    return activeTeam.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [activeTeam?.name]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Team
      </p>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700"
          onClick={() => setOpen((current) => !current)}
          disabled={!hasTeams && !onCreateTeam}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
              {initials}
            </span>
            <span className="text-sm font-medium">
              {activeTeam?.name ?? "No teams yet"}
            </span>
          </span>
          <Icon name="chevronDown" className="h-3 w-3 text-slate-400" />
        </button>
        {open ? (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="max-h-60 overflow-y-auto">
              {teams.map((team) => {
                const isActive = team.id === activeTeamId;
                const teamInitials = team.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("");
                return (
                  <button
                    key={team.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onChange(team.id);
                      setOpen(false);
                    }}
                    className={`flex h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {teamInitials}
                      </span>
                      {team.name}
                    </span>
                    {isActive ? (
                      <span className="text-xs font-semibold">Active</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {onCreateTeam ? (
              <div className="border-t border-slate-200 p-2 dark:border-slate-700">
                {isCreating ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(event) => setNewTeamName(event.target.value)}
                      placeholder="Team name"
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                    {error ? (
                      <p className="text-xs text-red-500">{error}</p>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex h-11 flex-1 items-center justify-center rounded-lg bg-indigo-500 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                        disabled={busy}
                        onClick={async () => {
                          setError("");
                          setBusy(true);
                          try {
                            await onCreateTeam(newTeamName);
                            setNewTeamName("");
                            setIsCreating(false);
                            setOpen(false);
                          } catch (err) {
                            setError(
                              err instanceof Error ? err.message : "Unable to create team."
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        className="flex h-11 flex-1 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                        onClick={() => {
                          setIsCreating(false);
                          setNewTeamName("");
                          setError("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex h-11 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                    onClick={() => setIsCreating(true)}
                  >
                    <Icon name="plus" className="h-4 w-4" />
                    Create new team
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TeamSwitcher;

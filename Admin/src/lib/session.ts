import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "./api";
import { isTeamAdmin, type TeamMember, type TeamSummary } from "./teams";

export type SessionUser = {
  userId: string;
  username: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  status: string;
  isSuperUser?: boolean;
};

export const useSessionState = (refreshKey?: string) => {
  const [hasToken, setHasToken] = useState(Boolean(localStorage.getItem("accessToken")));
  const [me, setMe] = useState<SessionUser | null>(null);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [activeTeamId, setActiveTeamId] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem("accessToken")));
  }, [refreshKey]);

  useEffect(() => {
    if (!hasToken) {
      setMe(null);
      return;
    }
    let isMounted = true;
    apiFetch<SessionUser>("/auth/session")
      .then((payload) => {
        if (isMounted) {
          setMe(payload);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMe(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [hasToken]);

  useEffect(() => {
    if (!hasToken) {
      setTeams([]);
      setActiveTeamId("");
      return;
    }
    let isMounted = true;
    apiFetch<{ teams: TeamSummary[] }>("/teams")
      .then((payload) => {
        if (!isMounted) return;
        const list = Array.isArray(payload?.teams) ? payload.teams : [];
        setTeams(list);
        setActiveTeamId((current) => {
          if (list.length === 0) {
            return "";
          }
          if (current && list.some((team) => team.id === current)) {
            return current;
          }
          return list[0].id;
        });
      })
      .catch(() => {
        if (isMounted) {
          setTeams([]);
          setActiveTeamId("");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [hasToken]);

  const activeTeam = useMemo(
    () => (activeTeamId ? teams.find((team) => team.id === activeTeamId) || null : null),
    [teams, activeTeamId]
  );

  const isAdmin = isTeamAdmin(activeTeam?.memberRole);

  useEffect(() => {
    if (!activeTeam?.id || !isAdmin || !hasToken) {
      setTeamMembers([]);
      return;
    }
    let isMounted = true;
    apiFetch<{ users: TeamMember[] }>(`/teams/${activeTeam.id}/users`, {
      headers: {
        "x-team-id": activeTeam.id,
      },
    })
      .then((payload) => {
        if (isMounted) {
          setTeamMembers(Array.isArray(payload?.users) ? payload.users : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTeamMembers([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [activeTeam?.id, isAdmin, hasToken]);

  const selectTeam = useCallback((teamId: string) => {
    setActiveTeamId(teamId);
    if (!teamId) {
      return;
    }
    apiFetch<{ activeTeamId: string }>(`/teams/${teamId}/select`, {
      method: "POST",
      headers: {
        "x-team-id": teamId,
      },
    }).catch(() => undefined);
  }, []);

  const createTeam = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Team name is required.");
    }
    const payload = await apiFetch<{ team?: TeamSummary } | TeamSummary>("/teams", {
      method: "POST",
      body: JSON.stringify({ name: trimmed }),
    });
    const team = "team" in payload ? payload.team : payload;
    if (!team) {
      return;
    }
    setTeams((current) => {
      if (current.some((item) => item.id === team.id)) {
        return current;
      }
      return [team, ...current];
    });
    setActiveTeamId(team.id);
  }, []);

  return {
    hasToken,
    me,
    isSuperUser: Boolean(me?.isSuperUser),
    teams,
    activeTeamId,
    activeTeam,
    isAdmin,
    teamMembers,
    selectTeam,
    createTeam,
  };
};

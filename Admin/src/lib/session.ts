import { useCallback, useEffect, useMemo, useState } from "react";

import { API_BASE_URL, apiFetch } from "./api";
import { isTeamAdmin, type TeamMember, type TeamSummary } from "./teams";
import { translate } from "./i18n";

export type SessionUser = {
  userId: string;
  username: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  status: string;
  isSuperUser?: boolean;
};

export type BadgeCounts = {
  apps: number;
  builds: number;
};

export type ProcessingCount = {
  processingCount: number;
};

export const useSessionState = (refreshKey?: string) => {
  const [hasToken, setHasToken] = useState(Boolean(localStorage.getItem("accessToken")));
  const [me, setMe] = useState<SessionUser | null>(null);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [activeTeamId, setActiveTeamId] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [badges, setBadges] = useState<BadgeCounts>({ apps: 0, builds: 0 });
  const [ingestEventsNonce, setIngestEventsNonce] = useState(0);
  const [processingBuildsCount, setProcessingBuildsCount] = useState(0);

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
      setBadges({ apps: 0, builds: 0 });
      return;
    }
    let isMounted = true;
    apiFetch<{ teams: TeamSummary[] }>("/teams")
      .then((payload) => {
        if (!isMounted) return;
        const version = Date.now();
        const list = Array.isArray(payload?.teams)
          ? payload.teams.map((team) => ({
              ...team,
              logoUrl: `${API_BASE_URL}/teams/${team.id}/logo?v=${version}`,
            }))
          : [];
        setTeams(list);
        setActiveTeamId((current) => {
          const pendingTeamId = localStorage.getItem("pendingActiveTeamId");
          if (pendingTeamId && list.some((team) => team.id === pendingTeamId)) {
            localStorage.removeItem("pendingActiveTeamId");
            return pendingTeamId;
          }
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
          setBadges({ apps: 0, builds: 0 });
        }
      });
    return () => {
      isMounted = false;
    };
  }, [hasToken, refreshKey]);

  const activeTeam = useMemo(
    () => (activeTeamId ? teams.find((team) => team.id === activeTeamId) || null : null),
    [teams, activeTeamId]
  );

  const isAdmin = isTeamAdmin(activeTeam?.memberRole);

  useEffect(() => {
    if (!hasToken || !activeTeam?.id) {
      setBadges({ apps: 0, builds: 0 });
      setProcessingBuildsCount(0);
      return;
    }
    let isMounted = true;
    apiFetch<{ badges: BadgeCounts }>("/badges", {
      headers: {
        "x-team-id": activeTeam.id,
      },
    })
      .then((payload) => {
        if (isMounted) {
          setBadges(payload?.badges ?? { apps: 0, builds: 0 });
        }
      })
      .catch(() => {
        if (isMounted) {
          setBadges({ apps: 0, builds: 0 });
        }
      });
    return () => {
      isMounted = false;
    };
  }, [hasToken, activeTeam?.id]);

  useEffect(() => {
    if (!hasToken || !activeTeam?.id) {
      setProcessingBuildsCount(0);
      return;
    }
    let isMounted = true;
    apiFetch<ProcessingCount>("/ingest/processing-count", {
      headers: {
        "x-team-id": activeTeam.id,
      },
    })
      .then((payload) => {
        if (isMounted) {
          setProcessingBuildsCount(payload?.processingCount ?? 0);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProcessingBuildsCount(0);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [hasToken, activeTeam?.id, ingestEventsNonce]);

  useEffect(() => {
    if (!hasToken || !activeTeam?.id) {
      return;
    }
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      return;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8100";
    const wsBase = baseUrl.startsWith("https://")
      ? baseUrl.replace("https://", "wss://")
      : baseUrl.replace("http://", "ws://");
    const wsUrl = new URL("/ws", wsBase);
    wsUrl.searchParams.set("accessToken", accessToken);
    wsUrl.searchParams.set("teamId", activeTeam.id);
    const socket = new WebSocket(wsUrl.toString());
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "badges.updated" && payload.badges) {
          setBadges(payload.badges);
        }
        if (payload?.type === "ingest.completed" || payload?.type === "ingest.failed") {
          setIngestEventsNonce((current) => current + 1);
        }
      } catch {
        return;
      }
    };
    return () => {
      socket.close();
    };
  }, [hasToken, activeTeam?.id]);

  const refreshTeamMembers = useCallback(() => {
    if (!activeTeam?.id || !isAdmin || !hasToken) {
      setTeamMembers([]);
      return Promise.resolve();
    }
    return apiFetch<{ users: TeamMember[] }>(`/teams/${activeTeam.id}/users`, {
      headers: {
        "x-team-id": activeTeam.id,
      },
    })
      .then((payload) => {
        setTeamMembers(Array.isArray(payload?.users) ? payload.users : []);
      })
      .catch(() => {
        setTeamMembers([]);
      });
  }, [activeTeam?.id, isAdmin, hasToken]);

  useEffect(() => {
    refreshTeamMembers().catch(() => undefined);
  }, [refreshTeamMembers]);

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
      throw new Error(translate("team.error.nameRequired", "Team name is required."));
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
    refreshTeamMembers,
    badges,
    ingestEventsNonce,
    processingBuildsCount,
    selectTeam,
    createTeam,
  };
};

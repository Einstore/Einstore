import { getTeamBadges } from "./badges.js";

type SocketLike = {
  send: (data: string) => void;
  readyState?: number;
  on?: (event: string, handler: () => void) => void;
};

const OPEN_STATE = 1;
const teamSockets = new Map<string, Set<SocketLike>>();

const removeSocket = (teamId: string, socket: SocketLike) => {
  const set = teamSockets.get(teamId);
  if (!set) return;
  set.delete(socket);
  if (set.size === 0) {
    teamSockets.delete(teamId);
  }
};

export const registerTeamSocket = (teamId: string, socket: SocketLike) => {
  const set = teamSockets.get(teamId) ?? new Set<SocketLike>();
  set.add(socket);
  teamSockets.set(teamId, set);
  socket.on?.("close", () => removeSocket(teamId, socket));
  socket.on?.("error", () => removeSocket(teamId, socket));
};

export const broadcastTeamEvent = (teamId: string, payload: unknown) => {
  const set = teamSockets.get(teamId);
  if (!set || set.size === 0) return;
  const message = JSON.stringify(payload);
  for (const socket of set) {
    if (socket.readyState !== undefined && socket.readyState !== OPEN_STATE) {
      removeSocket(teamId, socket);
      continue;
    }
    try {
      socket.send(message);
    } catch {
      removeSocket(teamId, socket);
    }
  }
};

export const broadcastBadgesUpdate = async (teamId: string) => {
  const badges = await getTeamBadges(teamId);
  broadcastTeamEvent(teamId, { type: "badges.updated", badges });
};

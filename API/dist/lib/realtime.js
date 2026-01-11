import { getTeamBadges } from "./badges.js";
const OPEN_STATE = 1;
const teamSockets = new Map();
const removeSocket = (teamId, socket) => {
    const set = teamSockets.get(teamId);
    if (!set)
        return;
    set.delete(socket);
    if (set.size === 0) {
        teamSockets.delete(teamId);
    }
};
export const registerTeamSocket = (teamId, socket) => {
    const set = teamSockets.get(teamId) ?? new Set();
    set.add(socket);
    teamSockets.set(teamId, set);
    socket.on?.("close", () => removeSocket(teamId, socket));
    socket.on?.("error", () => removeSocket(teamId, socket));
};
export const broadcastTeamEvent = (teamId, payload) => {
    const set = teamSockets.get(teamId);
    if (!set || set.size === 0)
        return;
    const message = JSON.stringify(payload);
    for (const socket of set) {
        if (socket.readyState !== undefined && socket.readyState !== OPEN_STATE) {
            removeSocket(teamId, socket);
            continue;
        }
        try {
            socket.send(message);
        }
        catch {
            removeSocket(teamId, socket);
        }
    }
};
export const broadcastBadgesUpdate = async (teamId) => {
    const badges = await getTeamBadges(teamId);
    broadcastTeamEvent(teamId, { type: "badges.updated", badges });
};

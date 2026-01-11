import { authService } from "../auth/service.js";
import { prisma } from "../lib/prisma.js";
import { getTeamBadges } from "../lib/badges.js";
import { registerTeamSocket } from "../lib/realtime.js";
export async function realtimeRoutes(app) {
    app.get("/ws", { websocket: true }, async (connection, request) => {
        const query = request.query;
        const header = request.headers["authorization"];
        const headerToken = typeof header === "string" && header.startsWith("Bearer ") ? header.replace("Bearer ", "").trim() : "";
        const accessToken = headerToken ||
            (typeof query?.accessToken === "string" ? query.accessToken.trim() : "");
        const headerTeamId = typeof request.headers["x-team-id"] === "string"
            ? request.headers["x-team-id"].trim()
            : "";
        const queryTeamId = typeof query?.teamId === "string" ? query.teamId.trim() : "";
        if (!accessToken) {
            connection.socket.send(JSON.stringify({ error: "token_invalid", message: "Missing access token" }));
            connection.socket.close?.();
            return;
        }
        let session;
        try {
            session = await authService.getSession(accessToken);
        }
        catch {
            connection.socket.send(JSON.stringify({ error: "token_invalid", message: "Invalid access token" }));
            connection.socket.close?.();
            return;
        }
        const fallbackTeam = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { lastActiveTeamId: true },
        });
        const teamId = queryTeamId || headerTeamId || fallbackTeam?.lastActiveTeamId || "";
        if (!teamId) {
            connection.socket.send(JSON.stringify({ error: "team_required", message: "Team context required" }));
            connection.socket.close?.();
            return;
        }
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: session.userId } },
        });
        if (!membership) {
            connection.socket.send(JSON.stringify({ error: "forbidden", message: "Team access denied" }));
            connection.socket.close?.();
            return;
        }
        registerTeamSocket(teamId, connection.socket);
        const badges = await getTeamBadges(teamId).catch(() => ({ apps: 0, builds: 0 }));
        connection.socket.send(JSON.stringify({ type: "badges.updated", badges }));
    });
}

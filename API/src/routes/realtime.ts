import { FastifyInstance } from "fastify";
import { requireTeam } from "../auth/guard.js";
import { broadcastBadgesUpdate, registerTeamSocket } from "../lib/realtime.js";

type WebsocketConnection = {
  socket: {
    send: (data: string) => void;
  };
};

export async function realtimeRoutes(app: FastifyInstance) {
  app.get(
    "/ws",
    { preHandler: requireTeam, websocket: true },
    async (connection: WebsocketConnection, request) => {
      const teamId = request.team?.id;
      if (!teamId) {
        connection.socket.send(JSON.stringify({ error: "team_required" }));
        return;
      }
      registerTeamSocket(teamId, connection.socket);
      await broadcastBadgesUpdate(teamId).catch(() => undefined);
    },
  );
}

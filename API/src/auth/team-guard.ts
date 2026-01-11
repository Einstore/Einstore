import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function requireTeam(request: FastifyRequest, reply: FastifyReply) {
  const headerTeamId = request.headers["x-team-id"];
  const teamId = Array.isArray(headerTeamId) ? headerTeamId[0] : headerTeamId;

  const authUserId = request.auth?.user?.id;
  if (!authUserId) {
    return reply.status(401).send({ error: "missing_auth" });
  }

  const user = await prisma.user.findUnique({ where: { id: authUserId } });
  if (!user) {
    return reply.status(401).send({ error: "user_not_found" });
  }

  const resolvedTeamId = teamId || user.lastActiveTeamId;
  if (!resolvedTeamId) {
    return reply.status(400).send({ error: "missing_team" });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: resolvedTeamId, userId: user.id } },
    include: { team: true },
  });

  if (!membership) {
    return reply.status(403).send({ error: "forbidden" });
  }

  request.team = membership.team;
  request.teamMember = membership;
  request.user = user;
}

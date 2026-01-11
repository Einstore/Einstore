import type { FastifyReply, FastifyRequest } from "fastify";
import { asAuthError } from "@unlikeother/auth";
import { authService } from "./service.js";
import { prisma } from "../lib/prisma.js";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers["authorization"];
  if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "token_invalid", message: "Missing access token" });
  }
  const token = header.replace("Bearer ", "").trim();
  try {
    const session = await authService.getSession(token);
    request.auth = {
      user: {
        id: session.userId,
        username: session.username,
        email: session.email ?? null,
        name: session.name ?? null,
        avatarUrl: session.avatarUrl ?? null,
        status: session.status,
      },
    };
  } catch (err) {
    const authErr = asAuthError(err, "token_invalid");
    return reply.status(401).send({ error: authErr.code, message: authErr.message });
  }
}

export async function requireSuperUser(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) {
    return;
  }
  const userId = request.auth?.user.id;
  if (!userId) {
    return reply.status(401).send({ error: "token_invalid", message: "Missing access token" });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperUser: true },
  });
  if (!user?.isSuperUser) {
    return reply
      .status(403)
      .send({ error: "forbidden", message: "Super user access required" });
  }
}

export async function requireTeam(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) {
    return;
  }
  const userId = request.auth?.user.id;
  if (!userId) {
    return reply.status(401).send({ error: "token_invalid", message: "Missing access token" });
  }

  const headerTeamId = request.headers["x-team-id"];
  const teamId = typeof headerTeamId === "string" && headerTeamId.trim()
    ? headerTeamId.trim()
    : (await prisma.user.findUnique({
        where: { id: userId },
        select: { lastActiveTeamId: true },
      }))?.lastActiveTeamId;

  if (!teamId) {
    return reply.status(403).send({ error: "team_required", message: "Team context required" });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    include: { team: true },
  });
  if (!membership) {
    return reply.status(403).send({ error: "forbidden", message: "Team access denied" });
  }

  request.team = membership.team;
  request.teamMember = membership;
}

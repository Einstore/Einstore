import type { FastifyReply, FastifyRequest } from "fastify";
import { asAuthError } from "@unlikeother/auth";
import { authService } from "./service.js";
import { prisma } from "../lib/prisma.js";
import { resolveApiKeySecret, verifyApiKey } from "@rafiki270/api-keys";

const devBypassEnabled =
  process.env.AUTH_DEV_BYPASS === "true" && process.env.NODE_ENV !== "production";
const devBypassUserId = process.env.AUTH_DEV_USER_ID ?? "dev-user";
const devBypassTeamId = process.env.AUTH_DEV_TEAM_ID ?? "dev-team";
const devBypassRole = process.env.AUTH_DEV_ROLE ?? "owner";

const resolveApiKeyToken = (request: FastifyRequest) => {
  const apiKeyHeader = request.headers["x-api-key"];
  const queryToken =
    typeof request.query === "object" && request.query !== null && "token" in request.query
      ? (request.query as Record<string, unknown>).token
      : undefined;
  return (
    (typeof apiKeyHeader === "string" && apiKeyHeader.trim()) ||
    (typeof queryToken === "string" && queryToken.trim()) ||
    null
  );
};

const verifyApiKeyToken = async (token: string) => {
  const secret = resolveApiKeySecret({
    env: process.env,
    fallbackEnvKeys: ["AUTH_JWT_SECRET"],
    defaultSecret: "dev-api-key-secret",
  });
  return verifyApiKey(prisma, token.trim(), { secret });
};

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (devBypassEnabled) {
    request.auth = {
      user: {
        id: devBypassUserId,
        username: "dev",
        email: null,
        name: "Dev User",
        avatarUrl: null,
        status: "active",
      },
    };
    return;
  }
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
  if (devBypassEnabled) {
    request.team = { id: devBypassTeamId } as any;
    request.teamMember = { teamId: devBypassTeamId, userId: devBypassUserId, role: devBypassRole } as any;
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

export async function requireTeamAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireTeam(request, reply);
  if (reply.sent) {
    return;
  }
  if (devBypassEnabled) {
    return;
  }
  const role = request.teamMember?.role;
  if (role !== "owner" && role !== "admin") {
    return reply.status(403).send({ error: "forbidden", message: "Admin access required" });
  }
}

export async function requireTeamOrApiKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKeyToken = resolveApiKeyToken(request);
  if (apiKeyToken) {
    const { apiKey, error } = await verifyApiKeyToken(apiKeyToken);
    if (!apiKey || error === "api_key_invalid") {
      return reply
        .status(401)
        .send({ error: "api_key_invalid", message: "Invalid API key" });
    }
    if (error === "api_key_expired") {
      return reply
        .status(401)
        .send({ error: "api_key_expired", message: "API key expired" });
    }
    request.team = apiKey.team;
    request.apiKey = apiKey;
    return;
  }
  await requireTeam(request, reply);
}

export const requireApiKey =
  (options?: { types?: string[] }) => async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKeyToken = resolveApiKeyToken(request);
    if (!apiKeyToken) {
      return reply
        .status(401)
        .send({ error: "api_key_missing", message: "Missing API key" });
    }
    const { apiKey, error } = await verifyApiKeyToken(apiKeyToken);
    if (!apiKey || error === "api_key_invalid") {
      return reply
        .status(401)
        .send({ error: "api_key_invalid", message: "Invalid API key" });
    }
    if (error === "api_key_expired") {
      return reply
        .status(401)
        .send({ error: "api_key_expired", message: "API key expired" });
    }
    if (options?.types?.length && !options.types.includes(apiKey.type)) {
      return reply
        .status(403)
        .send({ error: "api_key_forbidden", message: "API key scope denied" });
    }
    request.team = apiKey.team;
    request.apiKey = apiKey;
  };

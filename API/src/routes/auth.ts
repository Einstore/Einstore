import { FastifyInstance } from "fastify";
import { z } from "zod";
import { authService } from "../auth/service.js";
import { asAuthError } from "@unlikeother/auth";
import { deriveInboxBaseForUser, normalizeTeamSlug, slugify } from "@rafiki270/teams";
import { prisma } from "../lib/prisma.js";

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  email: z.string().email().optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

const resetRequestSchema = z.object({
  email: z.string().email(),
});

const resetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const oauthStartSchema = z.object({
  redirectUri: z.string().url(),
  successRedirect: z.string().url(),
  failureRedirect: z.string().url(),
  codeChallenge: z.string().optional(),
  codeVerifier: z.string().optional(),
});

const oauthExchangeSchema = z.object({
  authCode: z.string().min(1),
});

const getContext = (request: { ip?: string; headers: { [key: string]: string | string[] | undefined } }) => ({
  ip: request.ip,
  userAgent: typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : undefined,
});

const resolvePersonalTeamName = (user: { fullName: string | null; username: string; email: string | null }) => {
  const fullName = user.fullName?.trim();
  if (fullName) {
    return `${fullName}'s team`;
  }
  const username = user.username.trim();
  if (username) {
    return `${username}'s team`;
  }
  const emailLocal = user.email?.split("@")[0]?.trim();
  if (emailLocal) {
    return `${emailLocal}'s team`;
  }
  return "Personal team";
};

const ensureUniqueSlug = async (base: string) => {
  const root = base || "team";
  let candidate = root;
  let suffix = 1;
  while (await prisma.team.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

const ensurePersonalTeam = async (userId: string) => {
  const membership = await prisma.teamMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (membership) {
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return;
  }

  const teamName = resolvePersonalTeamName(user);
  const slugBase = normalizeTeamSlug(slugify(teamName));
  const slug = await ensureUniqueSlug(slugBase);
  const inboxBase = deriveInboxBaseForUser({
    email: user.email ?? null,
    fullName: user.fullName ?? null,
    username: user.username,
  });
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name: teamName,
        slug,
        inboxBase,
        createdByUserId: user.id,
        createdAt: now,
        updatedAt: now,
      },
    });
    await tx.teamMember.create({
      data: { teamId: team.id, userId: user.id, role: "owner", createdAt: now },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { lastActiveTeamId: team.id },
    });
  });
};

const ensurePersonalTeamFromSession = async (session?: { accessToken?: string }) => {
  if (!session?.accessToken) {
    return;
  }
  const authSession = await authService.getSession(session.accessToken);
  await ensurePersonalTeam(authSession.userId);
};

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    try {
      const result = await authService.register(parsed.data, getContext(request));
      await ensurePersonalTeam(result.userId).catch(() => undefined);
      return reply.status(201).send(result);
    } catch (err) {
      const authErr = asAuthError(err, "validation_failed");
      return reply.status(400).send({ error: authErr.code, message: authErr.message });
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    try {
      const result = await authService.login(parsed.data, getContext(request));
      await ensurePersonalTeam(result.userId).catch(() => undefined);
      return reply.send(result);
    } catch (err) {
      const authErr = asAuthError(err, "invalid_credentials");
      return reply.status(401).send({ error: authErr.code, message: authErr.message });
    }
  });

  app.post("/auth/refresh", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    try {
      const result = await authService.refresh(parsed.data);
      return reply.send(result);
    } catch (err) {
      const authErr = asAuthError(err, "token_invalid");
      return reply.status(401).send({ error: authErr.code, message: authErr.message });
    }
  });

  app.post("/auth/logout", async (request, reply) => {
    const parsed = logoutSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    await authService.logout(parsed.data);
    return reply.send({ revoked: true });
  });

  app.get("/auth/session", async (request, reply) => {
    const header = request.headers["authorization"];
    if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "token_invalid", message: "Missing access token" });
    }
    const token = header.replace("Bearer ", "").trim();
    try {
      const session = await authService.getSession(token);
      await ensurePersonalTeam(session.userId).catch(() => undefined);
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { isSuperUser: true },
      });
      return reply.send({ ...session, isSuperUser: Boolean(user?.isSuperUser) });
    } catch (err) {
      const authErr = asAuthError(err, "token_invalid");
      return reply.status(401).send({ error: authErr.code, message: authErr.message });
    }
  });

  app.post("/auth/password-reset", async (request, reply) => {
    const parsed = resetRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const result = await authService.requestPasswordReset(parsed.data);
    return reply.send(result);
  });

  app.post("/auth/password-reset/confirm", async (request, reply) => {
    const parsed = resetConfirmSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    try {
      const result = await authService.resetPassword({
        token: parsed.data.token,
        password: parsed.data.newPassword,
      });
      return reply.send(result);
    } catch (err) {
      const authErr = asAuthError(err, "validation_failed");
      return reply.status(400).send({ error: authErr.code, message: authErr.message });
    }
  });

  app.get("/auth/oauth/:provider/start", async (request, reply) => {
    const provider = (request.params as { provider: string }).provider;
    const parsed = oauthStartSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    try {
      const result = await authService.oauthStart({
        provider: provider as "google" | "apple",
        redirectUri: parsed.data.redirectUri,
        successRedirect: parsed.data.successRedirect,
        failureRedirect: parsed.data.failureRedirect,
        codeChallenge: parsed.data.codeChallenge,
        codeVerifier: parsed.data.codeVerifier,
      });
      return reply.send({ authorizeUrl: result.authorizeUrl });
    } catch (err) {
      const authErr = asAuthError(err, "oauth_error");
      return reply.status(400).send({ error: authErr.code, message: authErr.message });
    }
  });

  app.get("/auth/oauth/:provider/callback", async (request, reply) => {
    const provider = (request.params as { provider: string }).provider;
    const query = request.query as {
      state?: string;
      code?: string;
      error?: string;
      error_description?: string;
    };
    try {
      const result = await authService.oauthCallback({
        provider: provider as "google" | "apple",
        state: query.state ?? "",
        code: query.code,
        error: query.error,
        errorDescription: query.error_description,
      });
      return reply.redirect(result.redirectUrl);
    } catch (err) {
      const authErr = asAuthError(err, "oauth_error");
      return reply.status(400).send({ error: authErr.code, message: authErr.message });
    }
  });

  app.post("/auth/oauth/exchange", async (request, reply) => {
    const parsed = oauthExchangeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    try {
      const result = await authService.oauthExchange(parsed.data, getContext(request));
      await ensurePersonalTeamFromSession(result.session).catch(() => undefined);
      return reply.send(result);
    } catch (err) {
      const authErr = asAuthError(err, "oauth_error");
      return reply.status(400).send({ error: authErr.code, message: authErr.message });
    }
  });
}

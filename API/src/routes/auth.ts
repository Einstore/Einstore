import { FastifyInstance } from "fastify";
import { z } from "zod";
import { authService } from "../auth/service.js";
import { asAuthError } from "@unlikeother/auth";

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

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    try {
      const result = await authService.register(parsed.data, getContext(request));
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
      return reply.send(session);
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
      return reply.send(result);
    } catch (err) {
      const authErr = asAuthError(err, "oauth_error");
      return reply.status(400).send({ error: authErr.code, message: authErr.message });
    }
  });
}

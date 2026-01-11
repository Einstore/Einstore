import type { FastifyReply, FastifyRequest } from "fastify";
import { asAuthError } from "@unlikeother/auth";
import { authService } from "./service.js";

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

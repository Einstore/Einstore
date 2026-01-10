import type { AuthSessionInfo } from "@unlikeother/auth";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthSessionInfo;
  }
}

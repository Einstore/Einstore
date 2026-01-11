import type { AuthSessionInfo } from "@unlikeother/auth";
import type { Team, TeamMember, User } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthSessionInfo;
    team?: Team;
    teamMember?: TeamMember;
    user?: User;
  }
}

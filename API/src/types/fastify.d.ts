import type { AuthSessionInfo } from "@unlikeother/auth";
import type { Team, TeamMember, User } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    auth?: {
      user: {
        id: string;
        username: AuthSessionInfo["username"];
        email?: AuthSessionInfo["email"] | null;
        name?: AuthSessionInfo["name"] | null;
        avatarUrl?: AuthSessionInfo["avatarUrl"] | null;
        status: AuthSessionInfo["status"];
      };
    };
    team?: Team;
    teamMember?: TeamMember;
    user?: User;
  }
}

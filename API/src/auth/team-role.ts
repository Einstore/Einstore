import type { FastifyReply, FastifyRequest } from "fastify";

const normalizeRole = (value: unknown) => (typeof value === "string" ? value.toLowerCase() : "");

export const requireTeamRole = (roles: string[] = []) => {
  const allowed = roles.map(normalizeRole);
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const currentRole = normalizeRole(request.teamMember?.role);
    if (!currentRole) {
      return reply.status(403).send({ error: "forbidden" });
    }
    if (allowed.length && !allowed.includes(currentRole)) {
      return reply.status(403).send({ error: "forbidden" });
    }
  };
};

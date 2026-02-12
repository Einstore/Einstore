import { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/guard.js";
import { prisma } from "../lib/prisma.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function teamSlugRoutes(app: FastifyInstance) {
  app.get(
    "/teams/slug-check",
    { preHandler: requireAuth },
    async (request, reply) => {
      const query = request.query as Record<string, unknown>;
      const slug = String(query?.slug ?? "")
        .trim()
        .toLowerCase();
      const excludeTeamId = String(query?.excludeTeamId ?? "").trim() || undefined;

      if (!slug) {
        return reply.status(400).send({ error: "missing_slug" });
      }

      if (!SLUG_PATTERN.test(slug)) {
        return reply.send({ available: false, reason: "invalid_format" });
      }

      const existing = await prisma.team.findUnique({
        where: { slug },
        select: { id: true },
      });

      const available = !existing || (excludeTeamId !== undefined && existing.id === excludeTeamId);

      return reply.send({ available });
    },
  );
}

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireTeam } from "../auth/guard.js";
import { prisma } from "../lib/prisma.js";
import { requireBuildForTeam } from "../lib/team-access.js";
import { cleanTagName, normalizeTagName } from "../lib/tags.js";

const buildParamsSchema = z.object({
  id: z.string().uuid(),
});

const setTagsSchema = z.object({
  tags: z.array(z.string().min(1).max(50)),
});

export async function buildTagRoutes(app: FastifyInstance) {
  app.get("/builds/:id/tags", { preHandler: requireTeam }, async (request, reply) => {
    const parsedParams = buildParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({ error: "Invalid params" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const build = await requireBuildForTeam(teamId, parsedParams.data.id);
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }

    const buildTags = await prisma.buildTag.findMany({
      where: { buildId: parsedParams.data.id },
      include: { tag: true },
      orderBy: { tag: { name: "asc" } },
    });

    return reply.send({ tags: buildTags.map((entry) => ({ id: entry.tag.id, name: entry.tag.name })) });
  });

  app.put("/builds/:id/tags", { preHandler: requireTeam }, async (request, reply) => {
    const parsedParams = buildParamsSchema.safeParse(request.params);
    const parsedBody = setTagsSchema.safeParse(request.body);
    if (!parsedParams.success || !parsedBody.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }

    const build = await requireBuildForTeam(teamId, parsedParams.data.id);
    if (!build) {
      return reply.status(404).send({ error: "Not found" });
    }

    const normalizedToName = new Map<string, string>();
    for (const tag of parsedBody.data.tags) {
      const cleaned = cleanTagName(tag);
      if (!cleaned) continue;
      const normalized = normalizeTagName(cleaned);
      if (!normalizedToName.has(normalized)) {
        normalizedToName.set(normalized, cleaned);
      }
    }

    const normalizedNames = Array.from(normalizedToName.keys());
    if (normalizedNames.length === 0) {
      await prisma.buildTag.deleteMany({ where: { buildId: parsedParams.data.id } });
      return reply.send({ tags: [] });
    }

    const existingTags = await prisma.tag.findMany({
      where: { teamId, normalizedName: { in: normalizedNames } },
    });
    const existingNormalized = new Set(existingTags.map((tag) => tag.normalizedName));
    const missingNormalized = normalizedNames.filter((name) => !existingNormalized.has(name));

    if (missingNormalized.length > 0) {
      await prisma.tag.createMany({
        data: missingNormalized.map((normalizedName) => ({
          teamId,
          name: normalizedToName.get(normalizedName) ?? normalizedName,
          normalizedName,
        })),
        skipDuplicates: true,
      });
    }

    const targetTags = await prisma.tag.findMany({
      where: { teamId, normalizedName: { in: normalizedNames } },
      orderBy: { name: "asc" },
    });
    const targetTagIds = targetTags.map((tag) => tag.id);

    await prisma.buildTag.deleteMany({
      where: { buildId: parsedParams.data.id, NOT: { tagId: { in: targetTagIds } } },
    });
    if (targetTagIds.length > 0) {
      await prisma.buildTag.createMany({
        data: targetTagIds.map((tagId) => ({ buildId: parsedParams.data.id, tagId })),
        skipDuplicates: true,
      });
    }

    return reply.send({ tags: targetTags.map((tag) => ({ id: tag.id, name: tag.name })) });
  });
}

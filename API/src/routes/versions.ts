import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../auth/guard.js";

const createVersionSchema = z.object({
  appId: z.string().uuid(),
  version: z.string().min(1),
});

const listQuerySchema = z.object({
  appId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function versionRoutes(app: FastifyInstance) {
  app.post("/versions", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createVersionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const created = await prisma.version.create({ data: parsed.data });
    return reply.status(201).send(created);
  });

  app.get("/versions", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const items = await prisma.version.findMany({
      where: { appId: parsed.data.appId },
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { createdAt: "desc" },
    });
    return reply.send(items);
  });

  app.get("/versions/:id", { preHandler: requireAuth }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const record = await prisma.version.findUnique({
      where: { id },
      include: { builds: true },
    });
    if (!record) {
      return reply.status(404).send({ error: "Not found" });
    }
    return reply.send(record);
  });
}

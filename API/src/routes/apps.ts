import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../auth/guard.js";

const createAppSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function appRoutes(app: FastifyInstance) {
  app.post("/apps", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createAppSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const created = await prisma.app.create({ data: parsed.data });
    return reply.status(201).send(created);
  });

  app.get("/apps", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const items = await prisma.app.findMany({
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { createdAt: "desc" },
    });
    return reply.send(items);
  });

  app.get("/apps/:id", { preHandler: requireAuth }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const record = await prisma.app.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!record) {
      return reply.status(404).send({ error: "Not found" });
    }
    return reply.send(record);
  });
}

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../auth/guard.js";

const createCapabilitySchema = z.object({
  targetId: z.string().uuid(),
  name: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const listQuerySchema = z.object({
  targetId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(200).default(200),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function capabilityRoutes(app: FastifyInstance) {
  app.post("/capabilities", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createCapabilitySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const capability = await prisma.capability.create({ data: parsed.data });
    return reply.status(201).send(capability);
  });

  app.get("/capabilities", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const items = await prisma.capability.findMany({
      where: { targetId: parsed.data.targetId },
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { name: "asc" },
    });
    return reply.send(items);
  });
}

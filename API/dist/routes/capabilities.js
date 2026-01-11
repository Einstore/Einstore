import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
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
export async function capabilityRoutes(app) {
    app.post("/capabilities", { preHandler: requireTeam }, async (request, reply) => {
        const parsed = createCapabilitySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const target = await prisma.target.findFirst({
            where: {
                id: parsed.data.targetId,
                build: { version: { app: { teamId } } },
            },
            select: { id: true },
        });
        if (!target) {
            return reply.status(404).send({ error: "Not found" });
        }
        const capability = await prisma.capability.create({ data: parsed.data });
        return reply.status(201).send(capability);
    });
    app.get("/capabilities", { preHandler: requireTeam }, async (request, reply) => {
        const parsed = listQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid query" });
        }
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const items = await prisma.capability.findMany({
            where: {
                targetId: parsed.data.targetId,
                target: { build: { version: { app: { teamId } } } },
            },
            skip: parsed.data.offset,
            take: parsed.data.limit,
            orderBy: { name: "asc" },
        });
        return reply.send(items);
    });
}

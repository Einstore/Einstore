import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../auth/guard.js";
const createVariantSchema = z.object({
    buildId: z.string().uuid(),
    kind: z.enum(["abi", "density", "language", "device"]),
    key: z.string().min(1),
    value: z.string().min(1),
    metadata: z.record(z.any()).optional(),
});
const listQuerySchema = z.object({
    buildId: z.string().uuid(),
    limit: z.coerce.number().int().positive().max(100).default(100),
    offset: z.coerce.number().int().nonnegative().default(0),
});
export async function variantRoutes(app) {
    app.post("/variants", { preHandler: requireAuth }, async (request, reply) => {
        const parsed = createVariantSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const variant = await prisma.variant.create({ data: parsed.data });
        return reply.status(201).send(variant);
    });
    app.get("/variants", { preHandler: requireAuth }, async (request, reply) => {
        const parsed = listQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid query" });
        }
        const items = await prisma.variant.findMany({
            where: { buildId: parsed.data.buildId },
            skip: parsed.data.offset,
            take: parsed.data.limit,
            orderBy: { key: "asc" },
        });
        return reply.send(items);
    });
}

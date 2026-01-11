import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeamAdmin } from "../auth/guard.js";
import { generateApiKey } from "../lib/api-keys.js";
const createSchema = z.object({
    name: z.string().trim().min(1).max(64),
    expiresAt: z.string().datetime().optional(),
});
const toApiKeyResponse = (record) => ({
    id: record.id,
    name: record.name,
    prefix: record.tokenPrefix,
    createdAt: record.createdAt,
    lastUsedAt: record.lastUsedAt,
    revokedAt: record.revokedAt,
    expiresAt: record.expiresAt,
    createdBy: record.createdByUser
        ? {
            id: record.createdByUser.id,
            name: record.createdByUser.fullName,
            email: record.createdByUser.email,
            username: record.createdByUser.username,
        }
        : null,
});
export async function apiKeyRoutes(app) {
    app.get("/api-keys", { preHandler: requireTeamAdmin }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const keys = await prisma.apiKey.findMany({
            where: { teamId },
            orderBy: { createdAt: "desc" },
            include: {
                createdByUser: {
                    select: { id: true, fullName: true, email: true, username: true },
                },
            },
        });
        return reply.send({ apiKeys: keys.map(toApiKeyResponse) });
    });
    app.post("/api-keys", { preHandler: requireTeamAdmin }, async (request, reply) => {
        const parsed = createSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const createdByUserId = request.auth?.user.id ?? null;
        const now = new Date();
        const { token, tokenHash, tokenPrefix } = generateApiKey();
        const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
        const apiKey = await prisma.apiKey.create({
            data: {
                teamId,
                name: parsed.data.name,
                tokenHash,
                tokenPrefix,
                createdByUserId,
                createdAt: now,
                updatedAt: now,
                expiresAt,
            },
            include: {
                createdByUser: {
                    select: { id: true, fullName: true, email: true, username: true },
                },
            },
        });
        return reply.status(201).send({ apiKey: toApiKeyResponse(apiKey), token });
    });
    app.delete("/api-keys/:id", { preHandler: requireTeamAdmin }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply
                .status(403)
                .send({ error: "team_required", message: "Team context required" });
        }
        const id = request.params.id;
        const existing = await prisma.apiKey.findFirst({
            where: { id, teamId },
        });
        if (!existing) {
            return reply.status(404).send({ error: "not_found", message: "API key not found" });
        }
        if (existing.revokedAt) {
            return reply.send({ revoked: true });
        }
        await prisma.apiKey.update({
            where: { id: existing.id },
            data: { revokedAt: new Date() },
        });
        return reply.send({ revoked: true });
    });
}

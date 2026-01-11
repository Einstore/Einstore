import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeamAdmin } from "../auth/guard.js";
import { buildApiKeyResponse, createApiKey, listApiKeys, resolveApiKeySecret, revokeApiKey, } from "@rafiki270/api-keys";
const createSchema = z.object({
    name: z.string().trim().min(1).max(64),
    expiresAt: z.string().datetime().optional(),
});
const resolveSecret = () => resolveApiKeySecret({
    env: process.env,
    fallbackEnvKeys: ["AUTH_JWT_SECRET"],
    defaultSecret: "dev-api-key-secret",
});
export async function apiKeyRoutes(app) {
    app.get("/api-keys", { preHandler: requireTeamAdmin }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const keys = await listApiKeys(prisma, teamId);
        return reply.send({ apiKeys: keys.map(buildApiKeyResponse) });
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
        const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
        const { apiKey, token } = await createApiKey(prisma, {
            teamId,
            name: parsed.data.name,
            createdByUserId,
            expiresAt,
            prefix: "ei_",
            secret: resolveSecret(),
        });
        return reply.status(201).send({ apiKey: buildApiKeyResponse(apiKey), token });
    });
    app.delete("/api-keys/:id", { preHandler: requireTeamAdmin }, async (request, reply) => {
        const teamId = request.team?.id;
        if (!teamId) {
            return reply
                .status(403)
                .send({ error: "team_required", message: "Team context required" });
        }
        const id = request.params.id;
        const result = await revokeApiKey(prisma, { id, teamId });
        if (result.notFound) {
            return reply.status(404).send({ error: "not_found", message: "API key not found" });
        }
        return reply.send({ revoked: true });
    });
}

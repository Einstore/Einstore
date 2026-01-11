import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireTeam } from "../auth/guard.js";
import { requireBuildForTeam } from "../lib/team-access.js";
const createArtifactSchema = z.object({
    buildId: z.string().uuid(),
    kind: z.enum([
        "privacy_manifest",
        "provisioning_profile",
        "entitlements",
        "permissions",
        "signing_info",
        "icon_set",
        "manifest",
    ]),
    label: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    storageKind: z.enum(["local", "s3"]),
    storagePath: z.string().min(1),
});
const listQuerySchema = z.object({
    buildId: z.string().uuid(),
    limit: z.coerce.number().int().positive().max(200).default(200),
    offset: z.coerce.number().int().nonnegative().default(0),
});
export async function artifactRoutes(app) {
    app.post("/artifacts", { preHandler: requireTeam }, async (request, reply) => {
        const parsed = createArtifactSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const build = await requireBuildForTeam(teamId, parsed.data.buildId);
        if (!build) {
            return reply.status(404).send({ error: "Not found" });
        }
        const artifact = await prisma.complianceArtifact.create({
            data: {
                buildId: parsed.data.buildId,
                kind: parsed.data.kind,
                label: parsed.data.label,
                metadata: parsed.data.metadata,
                storageKind: parsed.data.storageKind,
                storagePath: parsed.data.storagePath,
            },
        });
        return reply.status(201).send(artifact);
    });
    app.get("/artifacts", { preHandler: requireTeam }, async (request, reply) => {
        const parsed = listQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid query" });
        }
        const teamId = request.team?.id;
        if (!teamId) {
            return reply.status(403).send({ error: "team_required", message: "Team context required" });
        }
        const items = await prisma.complianceArtifact.findMany({
            where: { buildId: parsed.data.buildId, build: { version: { app: { teamId } } } },
            skip: parsed.data.offset,
            take: parsed.data.limit,
            orderBy: { createdAt: "desc" },
        });
        return reply.send(items);
    });
}

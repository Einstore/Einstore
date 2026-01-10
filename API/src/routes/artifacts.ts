import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../auth/guard.js";

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

export async function artifactRoutes(app: FastifyInstance) {
  app.post("/artifacts", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createArtifactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
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

  app.get("/artifacts", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }
    const items = await prisma.complianceArtifact.findMany({
      where: { buildId: parsed.data.buildId },
      skip: parsed.data.offset,
      take: parsed.data.limit,
      orderBy: { createdAt: "desc" },
    });
    return reply.send(items);
  });
}

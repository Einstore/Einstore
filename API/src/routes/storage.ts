import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireTeam } from "../auth/guard.js";

const storageSchema = z.object({
  kind: z.enum(["local", "s3"]),
  localRoot: z.string().optional(),
  s3Bucket: z.string().optional(),
  s3Region: z.string().optional(),
});

type StorageConfig = z.infer<typeof storageSchema>;

const storageByTeam = new Map<string, StorageConfig>();

export async function storageRoutes(app: FastifyInstance) {
  app.get("/storage", { preHandler: requireTeam }, async (request, reply) => {
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    return storageByTeam.get(teamId) ?? { kind: "local" };
  });

  app.post("/storage", { preHandler: requireTeam }, async (request, reply) => {
    const parsed = storageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }
    const teamId = request.team?.id;
    if (!teamId) {
      return reply.status(403).send({ error: "team_required", message: "Team context required" });
    }
    storageByTeam.set(teamId, parsed.data);
    return reply.send(parsed.data);
  });
}

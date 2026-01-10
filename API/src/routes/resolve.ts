import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { resolveAndroidInstall } from "../lib/resolve/android.js";

const deviceSchema = z.object({
  platform: z.enum(["ios", "android", "watchos", "wearos", "tvos", "visionos", "auto"]),
  osVersion: z.string().min(1),
  deviceFamily: z.string().optional(),
  abi: z.string().optional(),
  density: z.string().optional(),
  language: z.string().optional(),
  pairedWatch: z.boolean().optional(),
});

export async function resolveRoutes(app: FastifyInstance) {
  app.post("/resolve-install", async (request, reply) => {
    const body = request.body as { buildId?: string; device?: unknown };
    const buildId = body?.buildId;
    const parsedDevice = deviceSchema.safeParse(body?.device);

    if (!buildId || !parsedDevice.success) {
      return reply.status(400).send({ error: "Invalid payload" });
    }

    const platform = parsedDevice.data.platform;
    if (platform === "android" || platform === "wearos" || platform === "auto") {
      const build = await prisma.build.findUnique({
        where: { id: buildId },
        select: { id: true, storageKind: true, storagePath: true },
      });
      if (!build) {
        return reply.status(404).send({ error: "Not found" });
      }
      const result = await resolveAndroidInstall({
        buildId: build.id,
        storageKind: build.storageKind,
        storagePath: build.storagePath,
        device: {
          osVersion: parsedDevice.data.osVersion,
          abi: parsedDevice.data.abi,
          density: parsedDevice.data.density,
          language: parsedDevice.data.language,
        },
      });
      return reply.send({ buildId, device: parsedDevice.data, result });
    }

    return reply.send({
      buildId,
      device: parsedDevice.data,
      status: "resolver-not-implemented",
    });
  });
}

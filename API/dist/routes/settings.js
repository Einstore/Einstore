import { z } from "zod";
import { requireAuth, requireSuperUser } from "../auth/guard.js";
import { prisma } from "../lib/prisma.js";
const analyticsSchema = z.object({
    gaMeasurementId: z
        .string()
        .trim()
        .regex(/^G-[A-Z0-9]{8,}$/i, "Invalid Google Analytics measurement ID")
        .or(z.literal(null)),
});
const ANALYTICS_KEY = "analytics.gaMeasurementId";
export async function settingsRoutes(app) {
    app.get("/settings/analytics", { preHandler: requireAuth }, async (_request, reply) => {
        const setting = await prisma.siteSetting.findUnique({
            where: { key: ANALYTICS_KEY },
        });
        const gaMeasurementId = typeof setting?.value?.gaMeasurementId ===
            "string"
            ? (setting?.value).gaMeasurementId
            : null;
        return reply.send({ gaMeasurementId });
    });
    app.put("/settings/analytics", { preHandler: requireSuperUser }, async (request, reply) => {
        const parsed = analyticsSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply
                .status(400)
                .send({ error: "invalid_key", message: "Invalid Google Analytics key." });
        }
        const value = { gaMeasurementId: parsed.data.gaMeasurementId };
        const result = await prisma.siteSetting.upsert({
            where: { key: ANALYTICS_KEY },
            create: { key: ANALYTICS_KEY, value },
            update: { value },
        });
        const saved = typeof result.value?.gaMeasurementId ===
            "string"
            ? result.value.gaMeasurementId
            : null;
        return reply.send({ gaMeasurementId: saved });
    });
}

import { z } from "zod";
const storageSchema = z.object({
    kind: z.enum(["local", "s3"]),
    localRoot: z.string().optional(),
    s3Bucket: z.string().optional(),
    s3Region: z.string().optional(),
});
let currentStorage = { kind: "local" };
export async function storageRoutes(app) {
    app.get("/storage", async () => currentStorage);
    app.post("/storage", async (request, reply) => {
        const parsed = storageSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid payload" });
        }
        currentStorage = parsed.data;
        return reply.send(currentStorage);
    });
}

import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import { loadConfig } from "./lib/config.js";
import { prisma } from "./lib/prisma.js";
import { registerRoutes } from "./routes/index.js";
const config = loadConfig();
const app = Fastify({ logger: true });
const corsOrigins = config.CORS_ORIGINS
    ? config.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];
app.register(cors, {
    origin: corsOrigins.length ? corsOrigins : true,
});
app.register(multipart, {
    limits: {
        fileSize: config.UPLOAD_MAX_BYTES,
    },
});
app.register(websocket);
app.addHook("onClose", async () => {
    await prisma.$disconnect();
});
await registerRoutes(app);
await app.listen({ port: config.PORT, host: "0.0.0.0" });
app.log.info(`API running on ${config.PORT}`);

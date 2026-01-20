import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import { loadConfig } from "./lib/config.js";
import { prisma } from "./lib/prisma.js";
import { registerRoutes } from "./routes/index.js";
import { startIngestTimeoutCleanup } from "./lib/ingest-timeout-cleanup.js";

const config = loadConfig();
const app = Fastify({ logger: true });
const corsOrigins = config.CORS_ORIGINS
  ? config.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];
app.register(cors, {
  origin: corsOrigins.length ? corsOrigins : true,
  allowedHeaders: ["Authorization", "Content-Type", "x-team-id", "x-api-key"],
});
app.register(multipart, {
  limits: {
    fileSize: config.UPLOAD_MAX_BYTES,
  },
});
app.register(websocket);

const stopIngestCleanup = startIngestTimeoutCleanup();

app.addHook("onClose", async () => {
  stopIngestCleanup();
  await prisma.$disconnect();
});

await registerRoutes(app);

await app.listen({ port: config.PORT, host: "0.0.0.0" });

app.log.info(`API running on ${config.PORT}`);

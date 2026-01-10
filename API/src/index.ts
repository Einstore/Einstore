import Fastify from "fastify";
import { loadConfig } from "./lib/config.js";
import { prisma } from "./lib/prisma.js";
import { registerRoutes } from "./routes/index.js";

const config = loadConfig();
const app = Fastify({ logger: true });

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

await registerRoutes(app);

await app.listen({ port: config.PORT, host: "0.0.0.0" });

app.log.info(`API running on ${config.PORT}`);

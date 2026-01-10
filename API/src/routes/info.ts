import { FastifyInstance } from "fastify";

export async function infoRoutes(app: FastifyInstance) {
  app.get("/info", async () => ({
    name: "Einstore API",
    version: "1.0.0",
  }));
}

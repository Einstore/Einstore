import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import type { requireAuth, requireTeam } from "../auth/guard.js";

export type PrivateApiPluginDeps = {
  prisma: PrismaClient;
  requireAuth: typeof requireAuth;
  requireTeam: typeof requireTeam;
};

export type PrivateApiPlugin = {
  id: string;
  register: (app: FastifyInstance, deps: PrivateApiPluginDeps) => Promise<void> | void;
};

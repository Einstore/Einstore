import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../auth/guard.js";
import { requireTeam } from "../auth/team-guard.js";
import { parseString } from "../lib/parse.js";

const SETTING_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{1,80}$/;

const normalizeKey = (value: unknown) => {
  const key = parseString(value);
  if (!key || !SETTING_KEY_PATTERN.test(key)) {
    return null;
  }
  return key;
};

const respondSetting = (setting: { value?: unknown } | null, key: string) => ({
  key,
  value: setting?.value ?? null,
});

export async function userTeamSettingsRoutes(app: FastifyInstance) {
  app.get(
    "/user-team-settings/:key",
    { preHandler: [requireAuth, requireTeam] },
    async (request, reply) => {
      const key = normalizeKey((request.params as { key?: string }).key);
      if (!key) {
        return reply.status(400).send({ error: "invalid_key" });
      }

      const setting = await prisma.userTeamSetting.findUnique({
        where: {
          userId_teamId_key: {
            userId: request.user!.id,
            teamId: request.team!.id,
            key,
          },
        },
      });

      return reply.send(respondSetting(setting, key));
    },
  );

  app.put(
    "/user-team-settings/:key",
    { preHandler: [requireAuth, requireTeam] },
    async (request, reply) => {
      const key = normalizeKey((request.params as { key?: string }).key);
      if (!key) {
        return reply.status(400).send({ error: "invalid_key" });
      }

      const body = request.body as Record<string, unknown> | undefined;
      if (!Object.prototype.hasOwnProperty.call(body || {}, "value")) {
        return reply.status(400).send({ error: "missing_value" });
      }

      const setting = await prisma.userTeamSetting.upsert({
        where: {
          userId_teamId_key: {
            userId: request.user!.id,
            teamId: request.team!.id,
            key,
          },
        },
        create: {
          userId: request.user!.id,
          teamId: request.team!.id,
          key,
          value: body?.value ?? null,
        },
        update: {
          value: body?.value ?? null,
        },
      });

      return reply.send(respondSetting(setting, key));
    },
  );
}

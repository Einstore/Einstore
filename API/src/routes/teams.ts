import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../auth/guard.js";
import { requireTeam } from "../auth/team-guard.js";
import { requireTeamRole } from "../auth/team-role.js";
import { resolveCountryCode, resolveGeoipDefaults, resolveTimezoneInput } from "../lib/geoip.js";
import { loadConfig } from "../lib/config.js";
import {
  deriveInboxBaseForUser,
  normalizeTeamSlug,
  parseCategoryRequiredInput,
  parseCurrencyInput,
  parseExportPreset,
  parseOverviewStatsPeriodInput,
  parseTeamRoleInput,
  parseVatNumberRequiredInput,
  parseVatRegisteredInput,
  parseVatThresholdInput,
  serializeTeam,
  serializeTeamUser,
} from "../lib/team-utils.js";

const config = loadConfig();

const ensureUniqueSlug = async (base: string) => {
  const root = base || "team";
  let candidate = root;
  let suffix = 1;
  while (await prisma.team.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

const normalizeSlugInput = (value: string) => normalizeTeamSlug(value);

export async function teamRoutes(app: FastifyInstance) {
  app.get("/teams", { preHandler: requireAuth }, async (request, reply) => {
    const memberships = await prisma.teamMember.findMany({
      where: { userId: request.auth?.user?.id },
      include: { team: true },
      orderBy: { createdAt: "asc" },
    });
    return reply.send({
      teams: memberships.map((membership) => ({
        ...serializeTeam(membership.team),
        memberRole: membership.role,
      })),
    });
  });

  app.post("/teams", { preHandler: requireAuth }, async (request, reply) => {
    const name = String((request.body as { name?: string })?.name || "").trim();
    if (!name) {
      return reply.status(400).send({ error: "missing_name" });
    }

    const body = request.body as Record<string, unknown>;
    const currencyResult = parseCurrencyInput(body?.defaultCurrency);
    if ("error" in currencyResult) {
      return reply.status(400).send({ error: currencyResult.error });
    }
    const billingCurrencyResult = parseCurrencyInput(body?.billingCurrency);
    if ("error" in billingCurrencyResult) {
      return reply.status(400).send({ error: billingCurrencyResult.error });
    }
    const exportPresetResult = parseExportPreset(body?.defaultExportPreset);
    if ("error" in exportPresetResult) {
      return reply.status(400).send({ error: exportPresetResult.error });
    }
    const statsPeriodResult = parseOverviewStatsPeriodInput(body?.overviewStatsPeriod);
    if ("error" in statsPeriodResult) {
      return reply.status(400).send({ error: statsPeriodResult.error });
    }
    const vatRegisteredResult = parseVatRegisteredInput(body?.vatRegistered);
    if ("error" in vatRegisteredResult) {
      return reply.status(400).send({ error: vatRegisteredResult.error });
    }
    const vatRequiredResult = parseVatNumberRequiredInput(body?.vatNumberRequired);
    if ("error" in vatRequiredResult) {
      return reply.status(400).send({ error: vatRequiredResult.error });
    }
    const categoryRequiredResult = parseCategoryRequiredInput(body?.categoryRequired);
    if ("error" in categoryRequiredResult) {
      return reply.status(400).send({ error: categoryRequiredResult.error });
    }
    const vatThresholdResult = parseVatThresholdInput(body?.vatMissingThresholdMinor);
    if ("error" in vatThresholdResult) {
      return reply.status(400).send({ error: vatThresholdResult.error });
    }
    const countryResult = resolveCountryCode(body?.country);
    if ("error" in countryResult) {
      return reply.status(400).send({ error: countryResult.error });
    }
    const timezoneResult = resolveTimezoneInput(body?.timezone);
    if ("error" in timezoneResult) {
      return reply.status(400).send({ error: timezoneResult.error });
    }

    const userId = request.auth?.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: "missing_auth" });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ error: "user_not_found" });
    }

    const existingTeam = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      include: { team: true },
      orderBy: { createdAt: "asc" },
    });

    const inboxBase = deriveInboxBaseForUser(user, existingTeam?.team.inboxBase);
    const slugBase = normalizeSlugInput(String(body?.slug || name));
    const slug = await ensureUniqueSlug(slugBase);
    const now = new Date();
    const geoDefaults = resolveGeoipDefaults(request);
    const resolvedCountry =
      countryResult.value !== undefined ? countryResult.value : geoDefaults.country || null;
    const resolvedTimezone =
      timezoneResult.value !== undefined ? timezoneResult.value : geoDefaults.timezone || "UTC";

    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name,
          slug,
          inboxBase,
          createdByUserId: user.id,
          ...(currencyResult.value !== undefined ? { defaultCurrency: currencyResult.value } : {}),
          ...(billingCurrencyResult.value !== undefined
            ? { billingCurrency: billingCurrencyResult.value }
            : currencyResult.value
              ? { billingCurrency: currencyResult.value }
              : {}),
          ...(exportPresetResult.value !== undefined ? { defaultExportPreset: exportPresetResult.value } : {}),
          ...(statsPeriodResult.value !== undefined ? { overviewStatsPeriod: statsPeriodResult.value } : {}),
          ...(vatRegisteredResult.value !== undefined ? { vatRegistered: vatRegisteredResult.value } : {}),
          ...(vatRequiredResult.value !== undefined ? { vatNumberRequired: vatRequiredResult.value } : {}),
          ...(categoryRequiredResult.value !== undefined ? { categoryRequired: categoryRequiredResult.value } : {}),
          ...(vatThresholdResult.value !== undefined ? { vatMissingThresholdMinor: vatThresholdResult.value } : {}),
          ...(resolvedCountry !== undefined ? { country: resolvedCountry } : {}),
          ...(resolvedTimezone !== undefined ? { timezone: resolvedTimezone } : {}),
          createdAt: now,
          updatedAt: now,
        },
      });
      await tx.teamMember.create({
        data: { teamId: created.id, userId: user.id, role: "owner", createdAt: now },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { lastActiveTeamId: created.id },
      });
      return created;
    });

    return reply.status(201).send({ team: serializeTeam(team) });
  });

  app.get("/teams/:teamId", { preHandler: [requireAuth, requireTeam] }, async (request, reply) =>
    reply.send({ team: serializeTeam(request.team!) }),
  );

  app.patch(
    "/teams/:teamId",
    { preHandler: [requireAuth, requireTeam, requireTeamRole(["owner", "admin"]) ] },
    async (request, reply) => {
      const body = request.body as Record<string, unknown>;
      const name = typeof body?.name === "string" ? body.name.trim() : "";
      const slugInput = typeof body?.slug === "string" ? body.slug.trim() : "";
      if (body?.billingCurrency !== undefined) {
        return reply.status(400).send({ error: "billing_currency_locked" });
      }
      const data: Record<string, unknown> = {};
      if (name) {
        data.name = name;
      }
      const currencyResult = parseCurrencyInput(body?.defaultCurrency);
      if ("error" in currencyResult) {
        return reply.status(400).send({ error: currencyResult.error });
      }
      if (currencyResult.value !== undefined) {
        data.defaultCurrency = currencyResult.value;
      }
      const exportPresetResult = parseExportPreset(body?.defaultExportPreset);
      if ("error" in exportPresetResult) {
        return reply.status(400).send({ error: exportPresetResult.error });
      }
      if (exportPresetResult.value !== undefined) {
        data.defaultExportPreset = exportPresetResult.value;
      }
      const statsPeriodResult = parseOverviewStatsPeriodInput(body?.overviewStatsPeriod);
      if ("error" in statsPeriodResult) {
        return reply.status(400).send({ error: statsPeriodResult.error });
      }
      if (statsPeriodResult.value !== undefined) {
        data.overviewStatsPeriod = statsPeriodResult.value;
      }
      const vatRegisteredResult = parseVatRegisteredInput(body?.vatRegistered);
      if ("error" in vatRegisteredResult) {
        return reply.status(400).send({ error: vatRegisteredResult.error });
      }
      if (vatRegisteredResult.value !== undefined) {
        data.vatRegistered = vatRegisteredResult.value;
      }
      const vatRequiredResult = parseVatNumberRequiredInput(body?.vatNumberRequired);
      if ("error" in vatRequiredResult) {
        return reply.status(400).send({ error: vatRequiredResult.error });
      }
      if (vatRequiredResult.value !== undefined) {
        data.vatNumberRequired = vatRequiredResult.value;
      }
      const categoryRequiredResult = parseCategoryRequiredInput(body?.categoryRequired);
      if ("error" in categoryRequiredResult) {
        return reply.status(400).send({ error: categoryRequiredResult.error });
      }
      if (categoryRequiredResult.value !== undefined) {
        data.categoryRequired = categoryRequiredResult.value;
      }
      const vatThresholdResult = parseVatThresholdInput(body?.vatMissingThresholdMinor);
      if ("error" in vatThresholdResult) {
        return reply.status(400).send({ error: vatThresholdResult.error });
      }
      if (vatThresholdResult.value !== undefined) {
        data.vatMissingThresholdMinor = vatThresholdResult.value;
      }
      const countryResult = resolveCountryCode(body?.country);
      if ("error" in countryResult) {
        return reply.status(400).send({ error: countryResult.error });
      }
      if (countryResult.value !== undefined) {
        data.country = countryResult.value;
      }
      const timezoneResult = resolveTimezoneInput(body?.timezone);
      if ("error" in timezoneResult) {
        return reply.status(400).send({ error: timezoneResult.error });
      }
      if (timezoneResult.value !== undefined) {
        data.timezone = timezoneResult.value;
      }
      if (slugInput) {
        const slugBase = normalizeSlugInput(slugInput || request.team!.name);
        if (slugBase !== request.team!.slug) {
          data.slug = await ensureUniqueSlug(slugBase);
        }
      }
      if (!Object.keys(data).length) {
        return reply.send({ team: serializeTeam(request.team!) });
      }
      data.updatedAt = new Date();
      const updated = await prisma.team.update({ where: { id: request.team!.id }, data });
      return reply.send({ team: serializeTeam(updated) });
    },
  );

  app.get(
    "/teams/:teamId/users",
    { preHandler: [requireAuth, requireTeam, requireTeamRole(["owner", "admin"]) ] },
    async (request, reply) => {
      const members = await prisma.teamMember.findMany({
        where: { teamId: request.team!.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      return reply.send({ users: members.map((member) => serializeTeamUser(member)) });
    },
  );

  app.post(
    "/teams/:teamId/users",
    { preHandler: [requireAuth, requireTeam, requireTeamRole(["owner", "admin"]) ] },
    async (request, reply) => {
      const email = String((request.body as { email?: string })?.email || "")
        .trim()
        .toLowerCase();
      if (!email) {
        return reply.status(400).send({ error: "missing_email" });
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(404).send({ error: "user_not_found" });
      }
      const existing = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: request.team!.id, userId: user.id } },
      });
      if (existing) {
        return reply.status(409).send({ error: "already_member" });
      }
      const now = new Date();
      await prisma.teamMember.create({
        data: { teamId: request.team!.id, userId: user.id, role: "member", createdAt: now },
      });
      return reply.status(201).send({
        user: {
          id: user.id,
          email: user.email ?? null,
          fullName: user.fullName ?? null,
          name: user.fullName ?? user.username ?? user.email ?? null,
          avatarUrl: user.avatarUrl ?? null,
          username: user.username ?? null,
          role: "member",
          createdAt: now,
        },
      });
    },
  );

  app.patch(
    "/teams/:teamId/users/:userId",
    { preHandler: [requireAuth, requireTeam, requireTeamRole(["owner", "admin"]) ] },
    async (request, reply) => {
      const roleResult = parseTeamRoleInput((request.body as { role?: string })?.role);
      if ("error" in roleResult) {
        return reply.status(400).send({ error: roleResult.error });
      }
      if (!roleResult.value) {
        return reply.status(400).send({ error: "missing_role" });
      }
      const targetUserId = String((request.params as { userId?: string }).userId || "").trim();
      if (!targetUserId) {
        return reply.status(400).send({ error: "missing_user_id" });
      }
      const targetMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: request.team!.id, userId: targetUserId } },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              username: true,
            },
          },
        },
      });
      if (!targetMember) {
        return reply.status(404).send({ error: "member_not_found" });
      }
      if (targetMember.role === "owner") {
        return reply.status(403).send({ error: "owner_locked" });
      }
      if (roleResult.value === "owner" && request.teamMember?.role !== "owner") {
        return reply.status(403).send({ error: "owner_only" });
      }
      const updated = await prisma.teamMember.update({
        where: { teamId_userId: { teamId: request.team!.id, userId: targetUserId } },
        data: { role: roleResult.value },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              username: true,
            },
          },
        },
      });
      return reply.send({ user: serializeTeamUser(updated) });
    },
  );

  app.delete(
    "/teams/:teamId/users/:userId",
    { preHandler: [requireAuth, requireTeam, requireTeamRole(["owner", "admin"]) ] },
    async (request, reply) => {
      const targetUserId = String((request.params as { userId?: string }).userId || "").trim();
      if (!targetUserId) {
        return reply.status(400).send({ error: "missing_user_id" });
      }
      const targetMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: request.team!.id, userId: targetUserId } },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              username: true,
            },
          },
        },
      });
      if (!targetMember) {
        return reply.status(404).send({ error: "member_not_found" });
      }
      const isSelf = targetMember.userId === request.user?.id;
      if (targetMember.role === "owner" && !isSelf) {
        return reply.status(403).send({ error: "owner_locked" });
      }
      if (isSelf) {
        const remainingAdminOwners = await prisma.teamMember.count({
          where: {
            teamId: request.team!.id,
            role: { in: ["owner", "admin"] },
            NOT: { userId: targetMember.userId },
          },
        });
        if (remainingAdminOwners === 0) {
          return reply.status(400).send({ error: "last_admin_owner" });
        }
      }

      const { promoted } = await prisma.$transaction(async (tx) => {
        await tx.teamMember.delete({
          where: { teamId_userId: { teamId: request.team!.id, userId: targetUserId } },
        });
        let promotedMember: { userId: string } | null = null;
        if (isSelf && targetMember.role === "owner") {
          const ownerCount = await tx.teamMember.count({
            where: { teamId: request.team!.id, role: "owner" },
          });
          if (!ownerCount) {
            const nextAdmin = await tx.teamMember.findFirst({
              where: { teamId: request.team!.id, role: "admin" },
              orderBy: { createdAt: "asc" },
            });
            if (nextAdmin) {
              promotedMember = await tx.teamMember.update({
                where: { teamId_userId: { teamId: request.team!.id, userId: nextAdmin.userId } },
                data: { role: "owner" },
                select: { userId: true },
              });
            }
          }
        }
        return { promoted: promotedMember };
      });

      return reply.send({
        removedUserId: targetMember.userId,
        promotedUserId: promoted?.userId ?? null,
      });
    },
  );

  app.post("/teams/:teamId/select", { preHandler: [requireAuth, requireTeam] }, async (request, reply) => {
    await prisma.user.update({
      where: { id: request.auth?.user?.id },
      data: { lastActiveTeamId: request.team!.id },
    });
    return reply.send({ activeTeamId: request.team!.id });
  });

  app.get("/teams/:teamId/inbox", { preHandler: [requireAuth, requireTeam] }, async (request, reply) => {
    const address = `${request.team!.inboxBase}.${request.team!.slug}@${config.INBOUND_EMAIL_DOMAIN}`;
    return reply.send({ address });
  });
}

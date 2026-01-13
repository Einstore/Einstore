import { addOnCatalog, paidPlanIds, normalizePlanId, getPlanRank, planCatalog } from "./catalog.js";
import { stripeRequest } from "./stripe-client.js";
import {
  createCheckoutSession,
  ensureCustomer,
  getAddonSubscription,
  getMainSubscription,
  releaseSchedule,
  resolvePlanFromSubscription,
  scheduleDowngrade,
  syncTeamPlan,
} from "./subscriptions.js";
import { createBillingGuard } from "./guards.js";

const adminRoles = new Set(["owner", "admin"]);

const isObject = (value) => typeof value === "object" && value !== null;

const ensureAdmin = async (request, reply, requireTeam) => {
  await requireTeam(request, reply);
  if (reply.sent) return false;
  const role = request.teamMember?.role;
  if (!adminRoles.has(role)) {
    reply.status(403).send({ error: "forbidden", message: "Admin access required." });
    return false;
  }
  return true;
};

const normalizeSessionId = (input) => (typeof input === "string" ? input.trim() : "");

const sendBillingError = (reply, error) => {
  if (!error || typeof error !== "object" || !error.code) {
    throw error;
  }
  const statusCode = typeof error.statusCode === "number" ? error.statusCode : 403;
  return reply.status(statusCode).send({ error: error.code, message: error.message });
};

const parseInviteToken = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export async function register(app, { prisma, requireAuth, requireTeam }) {
  const billingGuard = createBillingGuard({ prisma });
  app.decorate("billingGuard", billingGuard);

  app.addHook("preHandler", async (request, reply) => {
    const routePath = request.routeOptions?.url || request.routerPath;
    if (request.method === "POST" && routePath === "/teams/:teamId/invites") {
      await requireTeam(request, reply);
      if (reply.sent) return;
      try {
        await billingGuard.assertCanInviteUser({ teamId: request.team?.id });
      } catch (err) {
        return sendBillingError(reply, err);
      }
    }

    if (request.method === "POST" && routePath === "/invites/:token/accept") {
      await requireAuth(request, reply);
      if (reply.sent) return;
      const token = parseInviteToken((request.params || {}).token);
      if (!token) return;
      const invite = await prisma.teamInvite.findUnique({ where: { token }, select: { teamId: true } });
      if (!invite) return;
      try {
        await billingGuard.assertCanAcceptInvite({
          teamId: invite.teamId,
          userId: request.auth?.user?.id ?? request.user?.id,
        });
      } catch (err) {
        return sendBillingError(reply, err);
      }
    }
  });

  app.get("/billing/status", { preHandler: requireTeam }, async (request, reply) => {
    try {
      const team = request.team;
      if (!team?.stripeCustomerId) {
        return reply.send({ planId: "free", status: "free", addOn: { enabled: false } });
      }

      const subscription = await getMainSubscription({
        team,
        prisma,
        customerId: team.stripeCustomerId,
      });
      const planInfo = subscription ? resolvePlanFromSubscription(subscription) : null;
      if (planInfo && planInfo.planId !== team.planName) {
        await syncTeamPlan({
          prisma,
          teamId: team.id,
          planId: planInfo.planId,
          subscription,
          customerId: team.stripeCustomerId,
        });
      }

      const addOnSubscription = await getAddonSubscription(
        team.stripeCustomerId,
        addOnCatalog["priority-support"].priceId,
      );
      let pendingPlan = subscription?.metadata?.einstore_pending_plan || null;
      if (subscription?.schedule) {
        const scheduleId =
          typeof subscription.schedule === "string" ? subscription.schedule : subscription.schedule.id;
        if (scheduleId) {
          const schedule = await stripeRequest({
            method: "GET",
            path: `/subscription_schedules/${scheduleId}`,
          });
          pendingPlan = schedule?.metadata?.einstore_pending_plan || pendingPlan;
        }
      }

      reply.send({
        planId: planInfo?.planId ?? "free",
        status: subscription?.status ?? "free",
        currentPeriodStart: subscription?.current_period_start ?? null,
        currentPeriodEnd: subscription?.current_period_end ?? null,
        cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
        pendingPlanId: pendingPlan,
        addOn: {
          enabled: Boolean(addOnSubscription && addOnSubscription.status !== "canceled"),
          status: addOnSubscription?.status ?? "inactive",
          currentPeriodEnd: addOnSubscription?.current_period_end ?? null,
          cancelAtPeriodEnd: Boolean(addOnSubscription?.cancel_at_period_end),
        },
      });
    } catch (err) {
      reply.status(502).send({ error: "stripe_error", message: err.message });
    }
  });

  app.post("/billing/checkout", { preHandler: requireTeam }, async (request, reply) => {
    const canProceed = await ensureAdmin(request, reply, requireTeam);
    if (!canProceed) return;

    const body = isObject(request.body) ? request.body : {};
    const planId = normalizePlanId(body.planId);
    const successUrl = body.successUrl;
    const cancelUrl = body.cancelUrl;

    if (!paidPlanIds.has(planId)) {
      return reply.status(400).send({ error: "invalid_plan", message: "Paid plan required." });
    }
    if (typeof successUrl !== "string" || typeof cancelUrl !== "string") {
      return reply
        .status(400)
        .send({ error: "invalid_redirect", message: "Missing success/cancel URLs." });
    }

    try {
      const team = request.team;
      const customerId = await ensureCustomer({ prisma, team, user: request.auth?.user });
      if (team.stripeSubscriptionId) {
        return reply.status(409).send({
          error: "subscription_exists",
          message: "Use /billing/plan to upgrade or downgrade an active plan.",
        });
      }

      const session = await createCheckoutSession({
        customerId,
        priceId: planCatalog[planId].priceId,
        successUrl,
        cancelUrl,
        metadata: {
          einstore_team_id: team.id,
          einstore_kind: "plan",
          einstore_plan_id: planId,
        },
      });

      reply.send({ url: session.url, sessionId: session.id });
    } catch (err) {
      reply.status(502).send({ error: "stripe_error", message: err.message });
    }
  });

  app.post("/billing/checkout/complete", { preHandler: requireTeam }, async (request, reply) => {
    const canProceed = await ensureAdmin(request, reply, requireTeam);
    if (!canProceed) return;

    const body = isObject(request.body) ? request.body : {};
    const sessionId = normalizeSessionId(body.sessionId);
    if (!sessionId) {
      return reply.status(400).send({ error: "invalid_session", message: "Session ID required." });
    }

    try {
      const session = await stripeRequest({
        method: "GET",
        path: `/checkout/sessions/${sessionId}`,
        params: { "expand[]": ["subscription", "customer"] },
      });

      const teamId = session?.metadata?.einstore_team_id;
      if (!teamId || teamId !== request.team.id) {
        return reply.status(403).send({ error: "forbidden", message: "Session team mismatch." });
      }

      if (session.metadata?.einstore_kind === "plan") {
        const subscription = session.subscription;
        const customerId = session.customer?.id;
        if (!subscription?.id || !customerId) {
          return reply
            .status(400)
            .send({ error: "invalid_session", message: "Subscription missing from session." });
        }
        const planInfo = resolvePlanFromSubscription(subscription);
        if (!planInfo) {
          return reply.status(400).send({ error: "invalid_session", message: "Plan missing." });
        }
        await syncTeamPlan({
          prisma,
          teamId: request.team.id,
          planId: planInfo.planId,
          subscription,
          customerId,
        });
      }

      reply.send({ status: "ok" });
    } catch (err) {
      reply.status(502).send({ error: "stripe_error", message: err.message });
    }
  });

  app.post("/billing/plan", { preHandler: requireTeam }, async (request, reply) => {
    const canProceed = await ensureAdmin(request, reply, requireTeam);
    if (!canProceed) return;

    const body = isObject(request.body) ? request.body : {};
    const planId = normalizePlanId(body.planId);
    if (planId !== "free" && !paidPlanIds.has(planId)) {
      return reply.status(400).send({ error: "invalid_plan", message: "Unknown plan selection." });
    }

    try {
      const team = request.team;
      if (!team.stripeCustomerId) {
        return reply.status(400).send({ error: "no_subscription", message: "No active subscription." });
      }

      const subscription = await getMainSubscription({
        team,
        prisma,
        customerId: team.stripeCustomerId,
      });
      if (!subscription) {
        return reply.status(400).send({ error: "no_subscription", message: "No active subscription." });
      }

      const planInfo = resolvePlanFromSubscription(subscription);
      if (!planInfo) {
        return reply
          .status(400)
          .send({ error: "invalid_subscription", message: "Plan item not found." });
      }

      if (planId === "free") {
        if (subscription.schedule?.id) {
          await releaseSchedule(subscription.schedule.id);
        }
        const updated = await stripeRequest({
          method: "POST",
          path: `/subscriptions/${subscription.id}`,
          params: { cancel_at_period_end: true },
        });
        return reply.send({
          status: "scheduled_cancel",
          effectiveAt: updated.current_period_end,
        });
      }

      if (planId === planInfo.planId) {
        return reply.send({ status: "unchanged", planId });
      }

      const change = getPlanRank(planId) - getPlanRank(planInfo.planId);
      if (change > 0) {
        if (subscription.schedule?.id) {
          await releaseSchedule(subscription.schedule.id);
        }
        const updated = await stripeRequest({
          method: "POST",
          path: `/subscriptions/${subscription.id}`,
          params: {
            "items[0][id]": planInfo.itemId,
            "items[0][price]": planCatalog[planId].priceId,
            billing_cycle_anchor: "now",
            proration_behavior: "none",
            cancel_at_period_end: false,
            metadata: { einstore_plan_id: planId },
          },
        });
        await syncTeamPlan({
          prisma,
          teamId: team.id,
          planId,
          subscription: updated,
          customerId: team.stripeCustomerId,
        });
        return reply.send({ status: "upgraded", planId, effectiveAt: updated.current_period_start });
      }

      const schedule = await scheduleDowngrade({
        subscription,
        currentPriceId: planInfo.priceId,
        targetPriceId: planCatalog[planId].priceId,
      });
      return reply.send({
        status: "scheduled",
        planId,
        effectiveAt: schedule.phases?.[1]?.start_date ?? subscription.current_period_end,
      });
    } catch (err) {
      reply.status(502).send({ error: "stripe_error", message: err.message });
    }
  });

  app.post("/billing/addon", { preHandler: requireTeam }, async (request, reply) => {
    const canProceed = await ensureAdmin(request, reply, requireTeam);
    if (!canProceed) return;

    const body = isObject(request.body) ? request.body : {};
    const enabled = Boolean(body.enabled);
    const successUrl = body.successUrl;
    const cancelUrl = body.cancelUrl;

    try {
      const team = request.team;
      if (!team.stripeCustomerId) {
        return reply.status(400).send({ error: "no_subscription", message: "No active subscription." });
      }

      const subscription = await getMainSubscription({
        team,
        prisma,
        customerId: team.stripeCustomerId,
      });
      const planInfo = subscription ? resolvePlanFromSubscription(subscription) : null;
      if (!planInfo) {
        return reply.status(400).send({ error: "no_plan", message: "Paid plan required." });
      }

      const addOnSubscription = await getAddonSubscription(
        team.stripeCustomerId,
        addOnCatalog["priority-support"].priceId,
      );
      if (!enabled) {
        if (!addOnSubscription || addOnSubscription.status === "canceled") {
          return reply.send({ status: "not_active" });
        }
        const updated = await stripeRequest({
          method: "POST",
          path: `/subscriptions/${addOnSubscription.id}`,
          params: { cancel_at_period_end: true },
        });
        return reply.send({
          status: "scheduled_cancel",
          effectiveAt: updated.current_period_end,
        });
      }

      if (addOnSubscription && addOnSubscription.status !== "canceled") {
        if (addOnSubscription.cancel_at_period_end) {
          await stripeRequest({
            method: "POST",
            path: `/subscriptions/${addOnSubscription.id}`,
            params: { cancel_at_period_end: false },
          });
        }
        return reply.send({ status: "active" });
      }
      if (typeof successUrl !== "string" || typeof cancelUrl !== "string") {
        return reply
          .status(400)
          .send({ error: "invalid_redirect", message: "Missing success/cancel URLs." });
      }

      const session = await createCheckoutSession({
        customerId: team.stripeCustomerId,
        priceId: addOnCatalog["priority-support"].priceId,
        successUrl,
        cancelUrl,
        metadata: {
          einstore_team_id: team.id,
          einstore_kind: "addon",
          einstore_addon_id: "priority-support",
        },
      });

      reply.send({ url: session.url, sessionId: session.id });
    } catch (err) {
      reply.status(502).send({ error: "stripe_error", message: err.message });
    }
  });
}

export default register;

const STRIPE_BASE_URL = "https://api.stripe.com/v1";
const planCatalog = {
  starter: { priceId: "price_1Sp9PrGY1l8e0vu2V2Ep6xlt", productId: "prod_TmiripgNgIJUFy", rank: 1 },
  team: { priceId: "price_1Sp9QkGY1l8e0vu2DjSwqnMe", productId: "prod_TmisKIoVsTAvhy", rank: 2 },
  enterprise: { priceId: "price_1Sp9RcGY1l8e0vu22WPQX0Ai", productId: "prod_Tmit1SlwXMLDca", rank: 3 },
};
const addOnCatalog = {
  "priority-support": { priceId: "price_1Sp9SWGY1l8e0vu2FqEt8OFm", productId: "prod_Tmiu00y3BRAyUm" },
};
const paidPlanIds = new Set(Object.keys(planCatalog));
const planPriceLookup = Object.entries(planCatalog).reduce((acc, [planId, plan]) => {
  acc[plan.priceId] = planId;
  return acc;
}, {});
const adminRoles = new Set(["owner", "admin"]);
const isObject = (value) => typeof value === "object" && value !== null;
const appendFormValue = (form, key, value) => {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => appendFormValue(form, `${key}[${index}]`, item));
    return;
  }
  if (isObject(value) && !(value instanceof Date)) {
    Object.entries(value).forEach(([childKey, childValue]) => {
      appendFormValue(form, `${key}[${childKey}]`, childValue);
    });
    return;
  }
  form.append(key, String(value));
};
const buildForm = (params) => {
  const form = new URLSearchParams();
  if (!params) return form;
  Object.entries(params).forEach(([key, value]) => appendFormValue(form, key, value));
  return form;
};
const stripeRequest = async ({ method, path, params }) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error("Stripe secret key missing.");
  }
  const url = new URL(`${STRIPE_BASE_URL}${path}`);
  const headers = { Authorization: `Bearer ${stripeKey}` };
  let body;
  if (method === "GET") {
    const query = buildForm(params);
    if (query.toString()) {
      url.search = query.toString();
    }
  } else {
    const form = buildForm(params);
    body = form.toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  const response = await fetch(url, { method, headers, body });
  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || "Stripe request failed.";
    const err = new Error(message);
    err.statusCode = response.status;
    throw err;
  }
  return payload;
};
const normalizePlanId = (planId) => (planId || "").toString().trim().toLowerCase();
const getPlanRank = (planId) => (planCatalog[planId]?.rank ?? 0);
const resolvePlanFromSubscription = (subscription) => {
  if (!subscription?.items?.data?.length) return null;
  const planItem = subscription.items.data.find((item) => planPriceLookup[item?.price?.id]);
  if (!planItem) return null;
  return {
    planId: planPriceLookup[planItem.price.id],
    itemId: planItem.id,
    priceId: planItem.price.id,
  };
};
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
const ensureCustomer = async ({ prisma, team, user }) => {
  if (team.stripeCustomerId) {
    return team.stripeCustomerId;
  }
  const customer = await stripeRequest({
    method: "POST",
    path: "/customers",
    params: {
      email: user?.email || undefined,
      name: team.name,
      metadata: {
        einstore_team_id: team.id,
        einstore_team_slug: team.slug,
      },
    },
  });
  await prisma.team.update({
    where: { id: team.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
};
const listSubscriptions = async (customerId) =>
  stripeRequest({
    method: "GET",
    path: "/subscriptions",
    params: {
      customer: customerId,
      status: "all",
      limit: 100,
      "expand[]": ["data.items"],
    },
  });
const getMainSubscription = async ({ team, prisma, customerId }) => {
  if (team.stripeSubscriptionId) {
    try {
      return await stripeRequest({
        method: "GET",
        path: `/subscriptions/${team.stripeSubscriptionId}`,
        params: { "expand[]": ["items", "schedule"] },
      });
    } catch (err) {
      if (err.statusCode !== 404) {
        throw err;
      }
    }
  }
  const subscriptions = await listSubscriptions(customerId);
  const match = subscriptions.data.find(
    (subscription) => subscription.metadata?.einstore_kind !== "addon" && subscription.status !== "canceled",
  );
  if (match && match.id !== team.stripeSubscriptionId) {
    await prisma.team.update({
      where: { id: team.id },
      data: { stripeSubscriptionId: match.id },
    });
  }
  return match || null;
};
const getAddonSubscription = async (customerId) => {
  const subscriptions = await listSubscriptions(customerId);
  return subscriptions.data.find((subscription) => {
    if (subscription.metadata?.einstore_kind === "addon") return true;
    return subscription.items?.data?.some(
      (item) => item?.price?.id === addOnCatalog["priority-support"].priceId,
    );
  });
};
const createCheckoutSession = async ({ customerId, priceId, successUrl, cancelUrl, metadata }) =>
  stripeRequest({
    method: "POST",
    path: "/checkout/sessions",
    params: {
      mode: "subscription",
      customer: customerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: metadata?.einstore_team_id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: { metadata },
    },
  });
const releaseSchedule = async (scheduleId) =>
  stripeRequest({
    method: "POST",
    path: `/subscription_schedules/${scheduleId}/release`,
  });
const scheduleDowngrade = async ({ subscription, currentPriceId, targetPriceId }) => {
  const scheduleId =
    subscription.schedule?.id ||
    (
      await stripeRequest({
        method: "POST",
        path: "/subscription_schedules",
        params: { from_subscription: subscription.id },
      })
    ).id;
  return stripeRequest({
    method: "POST",
    path: `/subscription_schedules/${scheduleId}`,
    params: {
      end_behavior: "release",
      phases: [
        {
          start_date: subscription.current_period_start,
          end_date: subscription.current_period_end,
          items: [{ price: currentPriceId, quantity: 1 }],
          proration_behavior: "none",
        },
        {
          start_date: subscription.current_period_end,
          items: [{ price: targetPriceId, quantity: 1 }],
          proration_behavior: "none",
        },
      ],
      metadata: { einstore_pending_plan: planPriceLookup[targetPriceId] },
    },
  });
};
export async function register(app, { prisma, requireTeam }) {
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
      const addOnSubscription = await getAddonSubscription(team.stripeCustomerId);
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
    const sessionId = body.sessionId;
    if (typeof sessionId !== "string" || !sessionId.trim()) {
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
        if (!subscription?.id || !session.customer?.id) {
          return reply
            .status(400)
            .send({ error: "invalid_session", message: "Subscription missing from session." });
        }
        await prisma.team.update({
          where: { id: request.team.id },
          data: {
            stripeCustomerId: session.customer.id,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            billingPeriodStart: subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000)
              : null,
            billingPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
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
        await prisma.team.update({
          where: { id: team.id },
          data: {
            stripeSubscriptionId: updated.id,
            subscriptionStatus: updated.status,
            billingPeriodStart: updated.current_period_start
              ? new Date(updated.current_period_start * 1000)
              : null,
            billingPeriodEnd: updated.current_period_end
              ? new Date(updated.current_period_end * 1000)
              : null,
          },
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
      const addOnSubscription = await getAddonSubscription(team.stripeCustomerId);
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
          return reply.send({ status: "active" });
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

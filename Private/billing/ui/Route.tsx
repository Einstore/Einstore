import { useEffect, useMemo, useState } from "react";

type PlanId = "free" | "starter" | "team" | "enterprise";

type Plan = {
  id: PlanId;
  label: string;
  price: string;
  description: string;
  perks: string[];
  featured?: boolean;
};

type AddOn = {
  id: "priority-support";
  label: string;
  price: string;
  description: string;
  notes: string[];
};

const plans: Plan[] = [
  {
    id: "free",
    label: "Free",
    price: "$0",
    description: "1 app, 1 user, 250 MB storage, 1 GB transfer.",
    perks: ["Great for personal testing", "Team invites disabled", "Oldest builds auto-delete if storage exceeded"],
  },
  {
    id: "starter",
    label: "Starter",
    price: "$4.99",
    description: "3 apps, 3 users, 10 builds/app, 1 GB storage, 10 GB transfer.",
    perks: ["Seat + build caps enforced", "Auto-delete oldest builds within an app", "Best for small teams"],
  },
  {
    id: "team",
    label: "Team",
    price: "$45",
    description: "Unlimited apps, 25 users, unlimited builds, 1 TB storage, 5 TB transfer.",
    perks: ["Hard 1 TB storage cap", "Transfer overages blocked gracefully", "Ideal for product teams"],
    featured: true,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    price: "$499",
    description: "Unlimited everything. 10 TB storage, 100 TB transfer. CI-heavy ready.",
    perks: ["Hard caps only", "Priority roadmap + SSO options", "Best for large orgs"],
  },
];

const addOns: AddOn[] = [
  {
    id: "priority-support",
    label: "Priority Support",
    price: "$799",
    description: "Priority channel + a dedicated support day.",
    notes: [
      "1 day access to a developer per month (non-transferable)",
      "WhatsApp + Email support with 12h SLA (UK hours)",
      "Requires an active paid plan",
    ],
  },
];

const useBillingAvailability = () => {
  const [available, setAvailable] = useState<"unknown" | "ready" | "unavailable">("unknown");

  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      try {
        const res = await fetch("/billing/status", { method: "GET" });
        if (!res.ok) throw new Error("billing unavailable");
        if (cancelled) return;
        setAvailable("ready");
      } catch {
        if (cancelled) return;
        setAvailable("unavailable");
      }
    };
    probe();
    return () => {
      cancelled = true;
    };
  }, []);

  return available;
};

const BillingRoute = () => {
  const [currentPlan, setCurrentPlan] = useState<PlanId>("team");
  const [processingPlan, setProcessingPlan] = useState<PlanId | null>(null);
  const [processingAddOn, setProcessingAddOn] = useState<AddOn["id"] | null>(null);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn["id"] | null>(null);
  const availability = useBillingAvailability();
  const panelClass = "rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800";
  const parsePrice = (value: string) => {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const currentPlanMeta = useMemo(() => plans.find((plan) => plan.id === currentPlan), [currentPlan]);
  const totalLabel = useMemo(() => {
    const planPrice = parsePrice(currentPlanMeta?.price ?? "$0");
    const addOnPrice = selectedAddOn ? parsePrice(addOns[0].price) : 0;
    const total = planPrice + addOnPrice;
    return `$${total.toFixed(total % 1 === 0 ? 0 : 2)}`;
  }, [currentPlanMeta, selectedAddOn]);

  const handleChangePlan = (target: PlanId) => {
    setProcessingPlan(target);
    setTimeout(() => {
      setCurrentPlan(target);
      setProcessingPlan(null);
    }, 900);
  };

  const handleToggleAddOn = (target: AddOn["id"]) => {
    setProcessingAddOn(target);
    setTimeout(() => {
      setProcessingAddOn(null);
      setSelectedAddOn((prev) => (prev === target ? null : target));
    }, 700);
  };

  const heroState =
    availability === "unavailable"
      ? "Billing module not detected. Running in open-source / self-hosted mode; all gates default to allowed."
      : "Manage your Einstore subscription: upgrade, downgrade (move to Free to cancel), or adjust add-ons.";

  return (
    <div className="billing-page flex w-full flex-col gap-6 pb-12">
      <header className={`${panelClass} flex flex-col gap-3`}>
        {availability === "ready" && currentPlanMeta && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              Active plan
            </span>
            <strong>{currentPlanMeta.label}</strong>
            <span className="text-slate-500 dark:text-slate-400">Renews monthly (simulated)</span>
            <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Storage: 420 GB / 1 TB</span>
              <span>•</span>
              <span>Transfer: 1.2 TB / 5 TB</span>
              <span>•</span>
              <span>Seats: 18 / 25</span>
            </div>
          </div>
        )}
      </header>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className={`${panelClass}`}>
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Subscription
                </p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Choose your plan</h2>
              </div>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-600 dark:text-slate-100 dark:hover:border-slate-500"
                onClick={() => handleChangePlan(currentPlan)}
                disabled={processingPlan !== null}
              >
                Refresh status
              </button>
            </header>

            <div className="mt-5 grid w-full min-w-0 grid-cols-4 gap-4">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlan;
                const isProcessing = processingPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`relative flex h-full min-w-0 flex-col gap-3 rounded-xl border border-slate-200 p-4 shadow-sm transition hover:-translate-y-[1px] dark:border-slate-700 ${
                      plan.featured
                        ? "bg-indigo-50/70 dark:bg-indigo-900/20"
                        : "bg-white/90 dark:bg-slate-900/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {plan.featured ? (
                          <span className="rounded-full bg-indigo-500/90 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                            Recommended
                          </span>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {plan.label}
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-50">{plan.price} / mo</div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
                    <ul className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                      {plan.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2">
                          <span className="mt-1 inline-block h-2 w-2 rounded-full bg-cyan-400" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-2">
                      <button
                        type="button"
                        onClick={() => handleChangePlan(plan.id)}
                        disabled={isProcessing || isCurrent}
                        className={`inline-flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60 ${
                          isCurrent
                            ? "border border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-300"
                            : "bg-indigo-500 text-white hover:bg-indigo-400"
                        }`}
                      >
                        {isProcessing
                          ? "Working…"
                          : isCurrent
                            ? "Current plan"
                            : plan.id === "free"
                              ? "Move to Free"
                              : "Select plan"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${panelClass}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Add-on
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Priority Support</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Add-on applies to any paid plan. Includes 1 day access to a developer per month, non-transferable.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {addOns[0].label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{addOns[0].description}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{addOns[0].price} / mo</span>
                </div>
                <ul className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {addOns[0].notes.map((note) => (
                    <li key={note} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAddOn("priority-support")}
                  disabled={processingAddOn === "priority-support"}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60"
                >
                  {processingAddOn === "priority-support"
                    ? "Updating…"
                    : selectedAddOn
                      ? "Remove add-on"
                      : "Add to plan"}
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Billed monthly. Applies immediately on activation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className={`${panelClass} flex h-fit flex-col gap-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Basket</p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Summary</h3>
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <div className="flex items-center justify-between">
              <span>Plan</span>
              <span className="font-semibold">{currentPlanMeta?.label ?? "Free"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Plan price</span>
              <span className="font-semibold">{currentPlanMeta?.price ?? "$0"} / mo</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Priority Support</span>
              <span className="font-semibold">{selectedAddOn ? addOns[0].price : "$0"}</span>
            </div>
            <div className="mt-3 border-t border-dashed border-slate-200 pt-3 text-sm dark:border-slate-700">
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{totalLabel} / mo</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            Review & Confirm
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
            onClick={() => handleChangePlan("free")}
          >
            Cancel (move to Free)
          </button>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Changes apply immediately in this preview. API enforcement happens server-side via Billing module.
          </div>
        </aside>
      </section>

      {availability === "unavailable" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm dark:border-amber-500/50 dark:bg-amber-900/30 dark:text-amber-100">
          Billing service not detected. This UI remains for operators; OSS/self-host builds continue without billing.
        </div>
      )}
    </div>
  );
};

export default BillingRoute;

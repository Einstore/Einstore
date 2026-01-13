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

  const planGridStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "1.5rem",
    }),
    [],
  );

  return (
    <div className="billing-page flex w-full flex-col gap-8 pb-12">
      {availability === "ready" && currentPlanMeta && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
            Active plan
          </span>
          <strong>{currentPlanMeta.label}</strong>
          <span className="text-slate-500 dark:text-slate-400">Renews monthly (simulated)</span>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Storage: 420 GB / 1 TB</span>
            <span>-</span>
            <span>Transfer: 1.2 TB / 5 TB</span>
            <span>-</span>
            <span>Seats: 18 / 25</span>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Subscription</p>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Choose your plan</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pick the plan that matches your team today and upgrade anytime.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
            onClick={() => handleChangePlan(currentPlan)}
            disabled={processingPlan !== null}
          >
            Refresh status
          </button>
        </header>

        <div style={planGridStyle}>
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isProcessing = processingPlan === plan.id;
            const wrapperClass = plan.featured
              ? "rounded-[24px] bg-gradient-to-br from-indigo-400 via-sky-400 to-rose-400 p-[1px] shadow-lg"
              : "rounded-[24px] border border-slate-200 shadow-sm dark:border-slate-700";
            const innerClass = plan.featured
              ? "rounded-[23px] bg-white/95 dark:bg-slate-900/85"
              : "rounded-[23px] bg-white/95 dark:bg-slate-900/80";

            return (
              <div key={plan.id} className={wrapperClass}>
                <div className={`${innerClass} flex h-full min-w-0 flex-col gap-4 p-5`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{plan.label}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
                    </div>
                    {plan.featured && (
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                        Most popular
                      </span>
                    )}
                  </div>

                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-semibold text-slate-900 dark:text-slate-50">{plan.price}</span>
                    <span className="pb-1 text-xs text-slate-500 dark:text-slate-400">per month</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleChangePlan(plan.id)}
                    disabled={isProcessing || isCurrent}
                    className={`inline-flex h-11 w-full items-center justify-center rounded-full px-4 text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60 ${
                      isCurrent
                        ? "border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        : plan.featured
                          ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                          : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    }`}
                  >
                    {isProcessing
                      ? "Working..."
                      : isCurrent
                        ? "Current plan"
                        : plan.id === "free"
                          ? "Move to Free"
                          : "Select plan"}
                  </button>

                  <ul className="mt-auto grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.25 7.3a1 1 0 0 1-1.423-.008L3.29 9.24a1 1 0 1 1 1.42-1.408l4.01 4.04 6.54-6.58a1 1 0 0 1 1.444-.002Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        className="grid gap-6"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "1.5rem" }}
      >
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Add-on</p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{addOns[0].label}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{addOns[0].description}</p>
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">{addOns[0].price} / mo</span>
          </div>

          <ul className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
            {addOns[0].notes.map((note) => (
              <li key={note} className="flex items-start gap-2">
                <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>{note}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleToggleAddOn("priority-support")}
              disabled={processingAddOn === "priority-support"}
              className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-60"
            >
              {processingAddOn === "priority-support"
                ? "Updating..."
                : selectedAddOn
                  ? "Remove add-on"
                  : "Add to plan"}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Billed monthly. Applies immediately on activation.
            </p>
          </div>
        </div>

        <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Basket</p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Summary</h3>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
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
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Review & Confirm
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
            onClick={() => handleChangePlan("free")}
          >
            Cancel (move to Free)
          </button>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
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

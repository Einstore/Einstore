import { useState } from "react";

const BillingRoute = () => {
  const [status, setStatus] = useState<"idle" | "processing">("idle");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Billing</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Placeholder billing module. Hook your payment provider here.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This is a stub page for private billing features.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60"
          onClick={() => setStatus("processing")}
          disabled={status === "processing"}
        >
          {status === "processing" ? "Processing…" : "Pay"}
        </button>
      </div>
    </div>
  );
};

export default BillingRoute;

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AlertKind = "info" | "ok" | "alert" | "danger";

export type AlertInput = {
  message: string;
  kind?: AlertKind;
  durationMs?: number;
  title?: string;
};

type AlertItem = {
  id: string;
  message: string;
  kind: AlertKind;
  durationMs: number;
  title?: string;
};

type AlertsContextValue = {
  pushAlert: (input: AlertInput) => string;
  dismissAlert: (id: string) => void;
};

const DEFAULT_DURATION = 5000;

const AlertsContext = createContext<AlertsContextValue | null>(null);

const resolveId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `alert-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const timeouts = useRef<Map<string, number>>(new Map());

  const dismissAlert = useCallback((id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
    const timeout = timeouts.current.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      timeouts.current.delete(id);
    }
  }, []);

  const pushAlert = useCallback(
    (input: AlertInput) => {
      const id = resolveId();
      const durationMs = input.durationMs ?? DEFAULT_DURATION;
      const next: AlertItem = {
        id,
        message: input.message,
        kind: input.kind ?? "info",
        durationMs,
        title: input.title,
      };
      setAlerts((current) => [next, ...current]);
      if (durationMs > 0) {
        const timeout = window.setTimeout(() => dismissAlert(id), durationMs);
        timeouts.current.set(id, timeout);
      }
      return id;
    },
    [dismissAlert]
  );

  const value = useMemo(() => ({ pushAlert, dismissAlert }), [pushAlert, dismissAlert]);

  return (
    <AlertsContext.Provider value={value}>
      {children}
      <AlertStack alerts={alerts} onDismiss={dismissAlert} />
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error("useAlerts must be used within AlertsProvider");
  }
  return context;
};

const alertStyles: Record<AlertKind, string> = {
  info: "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
  ok: "border-green-200 bg-green-50 text-green-900 dark:border-green-600/40 dark:bg-green-500/10 dark:text-green-100",
  alert: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
  danger: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100",
};

const AlertStack = ({
  alerts,
  onDismiss,
}: {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
}) => {
  if (!alerts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-6 z-50 flex w-[360px] max-w-[90vw] -translate-x-1/2 flex-col gap-2">
      {alerts.map((alert) => (
        <button
          key={alert.id}
          type="button"
          className={`pointer-events-auto w-full rounded-xl border px-4 py-3 text-left text-sm shadow-[0_10px_25px_rgba(0,0,0,0.08)] transition-all ${
            alertStyles[alert.kind]
          }`}
          onClick={() => onDismiss(alert.id)}
        >
          {alert.title ? (
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
              {alert.title}
            </div>
          ) : null}
          <div className="text-sm font-medium">{alert.message}</div>
        </button>
      ))}
    </div>
  );
};

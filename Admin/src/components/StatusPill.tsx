const statusStyles = {
  live: "bg-green-100 text-green-700",
  review: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  paused: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  queued: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  running: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  failed: "bg-red-100 text-red-700",
  success: "bg-green-100 text-green-700",
  healthy: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-500 text-white",
} as const;

type StatusKey = keyof typeof statusStyles;

type StatusPillProps = {
  status: StatusKey;
  label?: string;
};

const StatusPill = ({ status, label }: StatusPillProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        statusStyles[status]
      }`}
    >
      {label ?? status}
    </span>
  );
};

export default StatusPill;

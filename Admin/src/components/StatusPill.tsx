const statusStyles = {
  live: "bg-mint text-ink",
  review: "bg-mist text-ink",
  paused: "bg-sand text-ink/60",
  queued: "bg-sand text-ink/70",
  running: "bg-mint text-ink",
  failed: "bg-coral/15 text-coral",
  success: "bg-emerald-100 text-emerald-800",
  healthy: "bg-emerald-100 text-emerald-800",
  warning: "bg-mist text-ink",
  critical: "bg-coral text-white",
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

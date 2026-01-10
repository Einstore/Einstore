const statusStyles = {
  live: "bg-teal/15 text-teal",
  review: "bg-coral/15 text-coral",
  paused: "bg-cocoa/15 text-cocoa",
  queued: "bg-ink/10 text-ink",
  running: "bg-teal/15 text-teal",
  failed: "bg-coral/20 text-cocoa",
  success: "bg-teal/20 text-cocoa",
  healthy: "bg-teal/15 text-teal",
  warning: "bg-coral/15 text-coral",
  critical: "bg-cocoa/15 text-cocoa",
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

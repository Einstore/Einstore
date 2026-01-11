type ActionButtonProps = {
  label: string;
  variant?: "primary" | "outline" | "danger";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const variantStyles = {
  primary: "bg-indigo-500 text-white hover:bg-indigo-600",
  outline:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600",
  danger: "bg-red-500 text-white hover:bg-red-600",
} as const;

const ActionButton = ({
  label,
  variant = "outline",
  type = "button",
  onClick,
  disabled,
}: ActionButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-11 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        variantStyles[variant]
      }`}
    >
      {label}
    </button>
  );
};

export default ActionButton;

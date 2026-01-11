type ActionButtonProps = {
  label: string;
  variant?: "primary" | "outline" | "danger";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const variantStyles = {
  primary: "bg-ink text-white shadow-card hover:-translate-y-0.5",
  outline: "bg-white text-ink shadow-card hover:-translate-y-0.5",
  danger: "bg-coral text-white shadow-card hover:-translate-y-0.5",
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
      className={`h-11 rounded-full px-5 text-sm font-semibold transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-60 ${
        variantStyles[variant]
      }`}
    >
      {label}
    </button>
  );
};

export default ActionButton;

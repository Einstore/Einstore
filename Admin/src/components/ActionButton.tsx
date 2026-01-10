type ActionButtonProps = {
  label: string;
  variant?: "primary" | "outline" | "danger";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const variantStyles = {
  primary: "bg-ink text-sand hover:bg-ink/90",
  outline: "border border-ink/20 text-ink hover:border-ink",
  danger: "bg-coral text-ink hover:bg-coral/90",
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
      className={`h-11 rounded-full px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:cursor-not-allowed disabled:opacity-60 ${
        variantStyles[variant]
      }`}
    >
      {label}
    </button>
  );
};

export default ActionButton;

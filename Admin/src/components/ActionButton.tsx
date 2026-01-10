type ActionButtonProps = {
  label: string;
  variant?: "primary" | "outline";
};

const variantStyles = {
  primary: "bg-ink text-sand hover:bg-ink/90",
  outline: "border border-ink/20 text-ink hover:border-ink",
} as const;

const ActionButton = ({ label, variant = "outline" }: ActionButtonProps) => {
  return (
    <button
      type="button"
      className={`h-11 rounded-full px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
        variantStyles[variant]
      }`}
    >
      {label}
    </button>
  );
};

export default ActionButton;

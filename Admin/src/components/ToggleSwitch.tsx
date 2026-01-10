type ToggleSwitchProps = {
  checked: boolean;
  onToggle: () => void;
  label?: string;
};

const ToggleSwitch = ({ checked, onToggle, label }: ToggleSwitchProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex h-8 w-14 items-center rounded-full border border-ink/20 px-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
        checked ? "bg-teal/20" : "bg-white"
      }`}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className={`h-6 w-6 rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
};

export default ToggleSwitch;

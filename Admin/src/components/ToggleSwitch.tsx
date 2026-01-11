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
      className={`inline-flex h-11 w-14 items-center rounded-full border border-slate-200 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-700 ${
        checked ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
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

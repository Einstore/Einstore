type FilterPillProps = {
  label: string;
  active?: boolean;
};

const FilterPill = ({ label, active }: FilterPillProps) => {
  return (
    <button
      type="button"
      className={`h-11 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
        active
          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
};

export default FilterPill;

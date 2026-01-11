type FilterPillProps = {
  label: string;
  active?: boolean;
};

const FilterPill = ({ label, active }: FilterPillProps) => {
  return (
    <button
      type="button"
      className={`h-11 rounded-full px-4 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
        active
          ? "bg-mint text-ink shadow-card"
          : "bg-white text-ink/60 shadow-card"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
};

export default FilterPill;

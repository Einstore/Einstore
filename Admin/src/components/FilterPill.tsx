type FilterPillProps = {
  label: string;
  active?: boolean;
};

const FilterPill = ({ label, active }: FilterPillProps) => {
  return (
    <button
      type="button"
      className={`h-11 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
        active
          ? "bg-ink text-sand"
          : "border border-ink/15 text-ink/70 hover:border-ink"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
};

export default FilterPill;

import type { ReactNode } from "react";

type ToggleFieldProps = {
  id: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  trailing?: ReactNode;
};

const ToggleField = ({
  id,
  label,
  description,
  defaultChecked,
  trailing,
}: ToggleFieldProps) => {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white/70 p-4"
    >
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        {description ? (
          <p className="text-xs text-ink/60">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {trailing}
        <input
          id={id}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="h-5 w-5 rounded border-ink/30 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        />
      </div>
    </label>
  );
};

export default ToggleField;

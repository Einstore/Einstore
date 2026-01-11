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
      className="flex items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </p>
        {description ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {trailing}
        <input
          id={id}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="h-5 w-5 rounded border-slate-300 text-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-600"
        />
      </div>
    </label>
  );
};

export default ToggleField;

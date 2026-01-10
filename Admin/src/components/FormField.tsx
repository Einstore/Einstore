import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
};

const FormField = ({ label, htmlFor, hint, children }: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-wide text-ink/60"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
};

export default FormField;

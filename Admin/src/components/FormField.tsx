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
        className="text-xs font-medium uppercase tracking-wide text-ink/50"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink/40">{hint}</p> : null}
    </div>
  );
};

export default FormField;

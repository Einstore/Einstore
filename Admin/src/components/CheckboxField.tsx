import FormField from "./FormField";

type CheckboxFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
};

const CheckboxField = ({ id, label, checked, onChange, hint }: CheckboxFieldProps) => {
  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <label className="flex h-11 items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-600"
        />
        Default enabled
      </label>
    </FormField>
  );
};

export default CheckboxField;

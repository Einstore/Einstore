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
      <label className="flex items-center gap-3 text-sm text-ink/70">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-ink/30 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        />
        Default enabled
      </label>
    </FormField>
  );
};

export default CheckboxField;

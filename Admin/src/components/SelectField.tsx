import FormField from "./FormField";

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  id: string;
  label: string;
  options: SelectOption[];
  value?: string;
  hint?: string;
};

const SelectField = ({ id, label, options, value, hint }: SelectFieldProps) => {
  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <select
        id={id}
        defaultValue={value}
        className="h-11 w-full rounded-2xl border border-ink/15 bg-white/80 px-4 text-sm text-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

export default SelectField;

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
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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

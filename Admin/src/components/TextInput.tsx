import FormField from "./FormField";

type TextInputProps = {
  id: string;
  label: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  type?: "text" | "url" | "email";
  hint?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

const TextInput = ({
  id,
  label,
  placeholder,
  value,
  defaultValue,
  type = "text",
  hint,
  onChange,
  disabled,
}: TextInputProps) => {
  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <input
        id={id}
        type={type}
        value={value}
        defaultValue={value ? undefined : defaultValue}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700"
      />
    </FormField>
  );
};

export default TextInput;

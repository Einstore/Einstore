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
        className="h-11 w-full rounded-2xl border border-ink/15 bg-white/80 px-4 text-sm text-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
      />
    </FormField>
  );
};

export default TextInput;

import FormField from "./FormField";

type SearchFieldProps = {
  id: string;
  label: string;
  placeholder?: string;
};

const SearchField = ({ id, label, placeholder }: SearchFieldProps) => {
  return (
    <FormField label={label} htmlFor={id}>
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-ink/15 bg-white/80 px-4 text-sm text-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
      />
    </FormField>
  );
};

export default SearchField;

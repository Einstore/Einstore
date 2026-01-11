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
        className="h-11 w-full rounded-xl bg-white px-4 text-sm text-ink shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
      />
    </FormField>
  );
};

export default SearchField;

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
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
    </FormField>
  );
};

export default SearchField;

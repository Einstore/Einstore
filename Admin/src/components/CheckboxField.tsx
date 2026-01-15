import FormField from "./FormField";
import { useI18n } from "../lib/i18n";

type CheckboxFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
};

const CheckboxField = ({ id, label, checked, onChange, hint }: CheckboxFieldProps) => {
  const { t } = useI18n();
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
        {t("checkbox.defaultEnabled", "Default enabled")}
      </label>
    </FormField>
  );
};

export default CheckboxField;

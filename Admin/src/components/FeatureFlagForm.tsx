import ActionButton from "./ActionButton";
import CheckboxField from "./CheckboxField";
import Panel from "./Panel";
import TextInput from "./TextInput";
import { useI18n } from "../lib/i18n";

export type FeatureFlagFormValues = {
  key: string;
  description: string;
  defaultEnabled: boolean;
};

type FeatureFlagFormProps = {
  values: FeatureFlagFormValues;
  isEditing: boolean;
  isSubmitting?: boolean;
  error?: string;
  keyLocked?: boolean;
  onChange: (values: FeatureFlagFormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

const FeatureFlagForm = ({
  values,
  isEditing,
  isSubmitting,
  error,
  keyLocked,
  onChange,
  onSubmit,
  onCancel,
}: FeatureFlagFormProps) => {
  const { t } = useI18n();
  return (
    <Panel className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {isEditing ? t("flags.form.editTitle", "Edit flag") : t("flags.form.createTitle", "Create flag")}
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t(
            "flags.form.subtitle",
            "Use feature flags to prepare staged rollouts before they are activated."
          )}
        </p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="space-y-6"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,2fr)_auto]">
          <TextInput
            id="flag-key"
            label={t("flags.form.key.label", "Flag key")}
            value={values.key}
            placeholder={t("flags.form.key.placeholder", "release_notes_v2")}
            onChange={(next) => onChange({ ...values, key: next })}
            disabled={keyLocked}
          />
          <TextInput
            id="flag-description"
            label={t("flags.form.description.label", "Description")}
            value={values.description}
            placeholder={t("flags.form.description.placeholder", "Explain how the flag will be used")}
            onChange={(next) => onChange({ ...values, description: next })}
          />
          <div className="flex items-end gap-3">
            <CheckboxField
              id="flag-enabled"
              label={t("flags.form.default.label", "Default")}
              checked={values.defaultEnabled}
              onChange={(checked) =>
                onChange({ ...values, defaultEnabled: checked })
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            label={isEditing ? t("flags.form.update", "Update flag") : t("flags.form.create", "Create flag")}
            variant="primary"
            type="submit"
            disabled={isSubmitting}
          />
          {isEditing && onCancel ? (
            <ActionButton label={t("common.cancel", "Cancel")} variant="outline" onClick={onCancel} />
          ) : null}
        </div>
      </form>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </Panel>
  );
};

export default FeatureFlagForm;

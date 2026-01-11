import ActionButton from "./ActionButton";
import CheckboxField from "./CheckboxField";
import Panel from "./Panel";
import TextInput from "./TextInput";

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
  return (
    <Panel className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {isEditing ? "Edit flag" : "Create flag"}
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Use future flags to prepare staged rollouts before they are activated.
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
            label="Flag key"
            value={values.key}
            placeholder="release_notes_v2"
            onChange={(next) => onChange({ ...values, key: next })}
            disabled={keyLocked}
          />
          <TextInput
            id="flag-description"
            label="Description"
            value={values.description}
            placeholder="Explain how the flag will be used"
            onChange={(next) => onChange({ ...values, description: next })}
          />
          <div className="flex items-end gap-3">
            <CheckboxField
              id="flag-enabled"
              label="Default"
              checked={values.defaultEnabled}
              onChange={(checked) =>
                onChange({ ...values, defaultEnabled: checked })
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            label={isEditing ? "Update flag" : "Create flag"}
            variant="primary"
            type="submit"
            disabled={isSubmitting}
          />
          {isEditing && onCancel ? (
            <ActionButton label="Cancel" variant="outline" onClick={onCancel} />
          ) : null}
        </div>
      </form>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </Panel>
  );
};

export default FeatureFlagForm;

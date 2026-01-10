import { useMemo, useState } from "react";

import ConfirmDialog from "../components/ConfirmDialog";
import FeatureFlagForm, { type FeatureFlagFormValues } from "../components/FeatureFlagForm";
import FeatureFlagsTable from "../components/FeatureFlagsTable";
import SectionHeader from "../components/SectionHeader";
import type { FeatureFlag } from "../data/mock";
import { futureFlags } from "../data/mock";

const emptyForm: FeatureFlagFormValues = {
  key: "",
  description: "",
  defaultEnabled: false,
};

const FutureFlagsPage = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>(futureFlags);
  const [activeFlagId, setActiveFlagId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FeatureFlag | null>(null);
  const [formValues, setFormValues] = useState<FeatureFlagFormValues>(emptyForm);
  const [error, setError] = useState<string>("");

  const sortedFlags = useMemo(
    () => [...flags].sort((a, b) => a.key.localeCompare(b.key)),
    [flags]
  );

  const handleToggle = (flag: FeatureFlag) => {
    setFlags((prev) =>
      prev.map((item) =>
        item.id === flag.id
          ? { ...item, defaultEnabled: !item.defaultEnabled }
          : item
      )
    );
  };

  const handleEdit = (flag: FeatureFlag) => {
    setError("");
    setActiveFlagId(flag.id);
    setFormValues({
      key: flag.key,
      description: flag.description ?? "",
      defaultEnabled: flag.defaultEnabled,
    });
  };

  const resetForm = () => {
    setActiveFlagId(null);
    setFormValues(emptyForm);
    setError("");
  };

  const handleDelete = (flag: FeatureFlag) => {
    setPendingDelete(flag);
  };

  const confirmDelete = () => {
    if (!pendingDelete) {
      return;
    }
    setFlags((prev) => prev.filter((flag) => flag.id !== pendingDelete.id));
    if (activeFlagId === pendingDelete.id) {
      resetForm();
    }
    setPendingDelete(null);
  };

  const handleSubmit = () => {
    setError("");
    if (!formValues.key.trim()) {
      setError("Flag key is required.");
      return;
    }

    if (activeFlagId) {
      setFlags((prev) =>
        prev.map((flag) =>
          flag.id === activeFlagId
            ? {
                ...flag,
                key: formValues.key.trim(),
                description: formValues.description.trim() || null,
                defaultEnabled: formValues.defaultEnabled,
              }
            : flag
        )
      );
      resetForm();
      return;
    }

    const nextFlag: FeatureFlag = {
      id: `flag-${Date.now()}`,
      key: formValues.key.trim(),
      description: formValues.description.trim() || null,
      defaultEnabled: formValues.defaultEnabled,
    };

    setFlags((prev) => [...prev, nextFlag]);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Future flags"
        description="Stage upcoming rollouts and prepare releases with toggles that are ready when you are."
      />
      <FeatureFlagForm
        values={formValues}
        isEditing={Boolean(activeFlagId)}
        onChange={setFormValues}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        error={error}
      />
      <FeatureFlagsTable
        flags={sortedFlags}
        onEdit={handleEdit}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete future flag?"
        description={`This will remove ${pendingDelete?.key ?? "this flag"} from the rollout plan.`}
        confirmLabel="Delete flag"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default FutureFlagsPage;

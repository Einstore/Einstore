import { useCallback, useEffect, useMemo, useState } from "react";

import ConfirmDialog from "../components/ConfirmDialog";
import FeatureFlagForm, { type FeatureFlagFormValues } from "../components/FeatureFlagForm";
import FeatureFlagsTable from "../components/FeatureFlagsTable";
import SectionHeader from "../components/SectionHeader";
import type { FeatureFlag } from "../data/mock";
import { apiFetch } from "../lib/api";

const emptyForm: FeatureFlagFormValues = {
  key: "",
  description: "",
  defaultEnabled: false,
};

const FutureFlagsPage = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [activeFlagKey, setActiveFlagKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FeatureFlag | null>(null);
  const [formValues, setFormValues] = useState<FeatureFlagFormValues>(emptyForm);
  const [error, setError] = useState<string>("");
  const [loadError, setLoadError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const sortedFlags = useMemo(
    () => [...flags].sort((a, b) => a.key.localeCompare(b.key)),
    [flags]
  );

  const loadFlags = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await apiFetch<FeatureFlag[]>("/feature-flags");
      setFlags(Array.isArray(response) ? response : []);
    } catch (loadError) {
      setLoadError(loadError instanceof Error ? loadError.message : "Unable to load flags.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleToggle = async (flag: FeatureFlag) => {
    setError("");
    try {
      const updated = await apiFetch<FeatureFlag>(
        `/feature-flags/${encodeURIComponent(flag.key)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ defaultEnabled: !flag.defaultEnabled }),
        }
      );
      setFlags((prev) => prev.map((item) => (item.key === flag.key ? updated : item)));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update flag.");
    }
  };

  const handleEdit = (flag: FeatureFlag) => {
    setError("");
    setActiveFlagKey(flag.key);
    setFormValues({
      key: flag.key,
      description: flag.description ?? "",
      defaultEnabled: flag.defaultEnabled,
    });
  };

  const resetForm = () => {
    setActiveFlagKey(null);
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
    setIsSubmitting(true);
    setError("");
    apiFetch(`/feature-flags/${encodeURIComponent(pendingDelete.key)}`, {
      method: "DELETE",
    })
      .then(() => {
        setFlags((prev) => prev.filter((flag) => flag.key !== pendingDelete.key));
        if (activeFlagKey === pendingDelete.key) {
          resetForm();
        }
        setPendingDelete(null);
      })
      .catch((actionError) => {
        setError(actionError instanceof Error ? actionError.message : "Unable to delete flag.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleSubmit = async () => {
    setError("");
    if (!formValues.key.trim()) {
      setError("Flag key is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (activeFlagKey) {
        const updated = await apiFetch<FeatureFlag>(
          `/feature-flags/${encodeURIComponent(activeFlagKey)}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              description: formValues.description.trim() || null,
              defaultEnabled: formValues.defaultEnabled,
            }),
          }
        );
        setFlags((prev) => prev.map((flag) => (flag.key === updated.key ? updated : flag)));
        resetForm();
        return;
      }

      const created = await apiFetch<FeatureFlag>("/feature-flags", {
        method: "POST",
        body: JSON.stringify({
          key: formValues.key.trim(),
          description: formValues.description.trim() || null,
          defaultEnabled: formValues.defaultEnabled,
        }),
      });
      setFlags((prev) => [...prev, created]);
      resetForm();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to save flag.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    void loadFlags();
  }, [loadFlags]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Future flags"
        description="Stage upcoming rollouts and prepare releases with toggles that are ready when you are."
      />
      {loadError ? <p className="text-sm text-coral">{loadError}</p> : null}
      <FeatureFlagForm
        values={formValues}
        isEditing={Boolean(activeFlagKey)}
        keyLocked={Boolean(activeFlagKey)}
        isSubmitting={isSubmitting}
        onChange={setFormValues}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        error={error}
      />
      <FeatureFlagsTable
        flags={sortedFlags}
        isLoading={isLoading}
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

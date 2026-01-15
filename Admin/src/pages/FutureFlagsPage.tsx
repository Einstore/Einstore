import { FeatureFlagsPage } from "@rafiki270/feature-flags/admin";

import { apiFetch } from "../lib/api";
import { adminFeatureFlagDefinitions } from "../data/featureFlagDefinitions";
import { useI18n } from "../lib/i18n";

const FutureFlagsPage = () => {
  const { t } = useI18n();
  const filteredApiFetch = async (path: string, options?: RequestInit) => {
    const result = await apiFetch(path, options);
    if (typeof path === "string" && path.startsWith("/feature-flags") && Array.isArray(result)) {
      return result.filter(
        (item) =>
          item?.key !== "admin.activity_stream" && item?.key !== "admin.storage_usage"
      );
    }
    return result;
  };

  const localizedDefinitions = adminFeatureFlagDefinitions.map((definition) => ({
    ...definition,
    description: t(`flags.definition.${definition.key}`, definition.description),
  }));

  return (
    <div className="feature-flags-page">
      <FeatureFlagsPage apiFetch={filteredApiFetch} definitions={localizedDefinitions as any} />
    </div>
  );
};

export default FutureFlagsPage;

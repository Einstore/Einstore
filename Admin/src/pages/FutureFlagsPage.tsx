import { FeatureFlagsPage } from "@rafiki270/feature-flags/admin";

import { apiFetch } from "../lib/api";

const FutureFlagsPage = () => {
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

  return (
    <div className="feature-flags-page">
      <FeatureFlagsPage apiFetch={filteredApiFetch} />
    </div>
  );
};

export default FutureFlagsPage;

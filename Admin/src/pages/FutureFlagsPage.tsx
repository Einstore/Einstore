import { FeatureFlagsPage } from "@rafiki270/feature-flags/admin";

import { apiFetch } from "../lib/api";

const FutureFlagsPage = () => <FeatureFlagsPage apiFetch={apiFetch} />;

export default FutureFlagsPage;

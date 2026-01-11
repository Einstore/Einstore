export type SearchAppResult = {
  id: string;
  name: string;
  identifier: string;
};

export type SearchBuildResult = {
  id: string;
  buildNumber: string;
  displayName: string;
  version: string;
  createdAt: string;
  appId: string;
  appName: string;
  appIdentifier: string;
};

import type { PaginatedResponse } from "./pagination";

export type SearchResponse = {
  apps: PaginatedResponse<SearchAppResult>;
  builds: PaginatedResponse<SearchBuildResult>;
};

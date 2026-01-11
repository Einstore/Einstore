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

export type SearchResponse = {
  apps: SearchAppResult[];
  builds: SearchBuildResult[];
};

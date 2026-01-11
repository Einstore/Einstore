declare module "@rafiki270/api-keys/admin" {
  import type { ComponentType } from "react";

  export type ApiKeysPanelProps = {
    apiFetch: (url: string, options?: RequestInit) => Promise<unknown>;
    teamId: string;
    title?: string;
    description?: string;
  };

  export const ApiKeysPanel: ComponentType<ApiKeysPanelProps>;
}

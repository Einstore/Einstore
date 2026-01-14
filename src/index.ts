let policyEngine: unknown;

export const registerPolicyEngine = <T>(engine: T): T => {
  policyEngine = engine;
  return engine;
};

export const getPolicyEngine = <T = unknown>(): T | undefined => policyEngine as T | undefined;

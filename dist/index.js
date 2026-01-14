let policyEngine;

export const registerPolicyEngine = (engine) => {
  policyEngine = engine;
  return engine;
};

export const getPolicyEngine = () => policyEngine;

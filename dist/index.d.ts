export type PolicyEngine = unknown;

export function registerPolicyEngine<T>(engine: T): T;
export function getPolicyEngine<T = PolicyEngine>(): T | undefined;

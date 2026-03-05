export const PLAN_MODULE_KEYS = ["sales", "rentals"] as const;

export type PlanModuleKey = (typeof PLAN_MODULE_KEYS)[number];

export type PlanModulesMap = Partial<Record<string, PlanModuleKey[]>>;

import { PlanModulesMap } from "../types/plan/type.planModuleKey";
import { getPlanMatrixData } from "../utils/config-production/config.planMatrix";

export const PLAN_MODULES_MOCK: PlanModulesMap = Object.fromEntries(
  getPlanMatrixData().map((p) => [p.id, p.modules]),
) as PlanModulesMap;

import { PlanLimit } from "../types/plan/type.planLimitKey";
import { getPlanMatrixData } from "./mock.planMatrix";

export const PLAN_LIMITS_MOCK: PlanLimit[] = getPlanMatrixData().flatMap(
  (plan, planIdx) =>
    plan.limits.map((limitConfig, limitIdx) => ({
      id: `pl-${planIdx + 1}-${limitIdx + 1}`,
      planId: plan.id,
      limitKey: limitConfig.limitKey,
      limit: limitConfig.limit,
    })),
);

import { PlanFeature } from "../types/plan/planFeature";
import { getPlanMatrixData } from "../utils/config-production/config.planMatrix";

export const PLAN_FEATURES_MOCK: PlanFeature[] = getPlanMatrixData().flatMap(
  (plan, planIdx) =>
    plan.features.map((featureKey, featureIdx) => ({
      id: `pf-${planIdx + 1}-${featureIdx + 1}`,
      planId: plan.id,
      featureKey,
    })),
);

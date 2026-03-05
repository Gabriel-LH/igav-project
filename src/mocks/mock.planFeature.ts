import { PlanFeature } from "../types/plan/planFeature";
import { getPlanMatrixData } from "./mock.planMatrix";

export const PLAN_FEATURES_MOCK: PlanFeature[] = getPlanMatrixData().flatMap(
  (plan, planIdx) =>
    plan.features.map((featureKey, featureIdx) => ({
      id: `pf-${planIdx + 1}-${featureIdx + 1}`,
      planId: plan.id,
      featureKey,
    })),
);

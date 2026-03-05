"use client";

import { useTenantStore } from "@/src/store/useTenantStore";
import { useTenantSubscriptionStore } from "@/src/store/useTenantSubscriptionStore";
import { PLAN_FEATURES_MOCK } from "@/src/mocks/mock.planFeature";
import { useMemo } from "react";
import { PLAN_MODULES_MOCK } from "@/src/mocks/mock.planModules";
import { PlanModuleKey } from "@/src/types/plan/type.planModuleKey";

export function usePlanFeatures() {
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const getActiveSubscription = useTenantSubscriptionStore(
    (s) => s.getActiveSubscription,
  );

  const activePlanId = useMemo(() => {
    if (!activeTenant) return null;
    return getActiveSubscription(activeTenant.id)?.planId ?? null;
  }, [activeTenant, getActiveSubscription]);

  const activeFeatures = useMemo(() => {
    if (!activeTenant) return new Set<string>();

    const subscription = getActiveSubscription(activeTenant.id);
    if (!subscription) return new Set<string>();

    const planId = subscription.planId;

    // extraemos todas las caracteristicas de ese planId desde el mock
    const features = PLAN_FEATURES_MOCK.filter(
      (pf) => pf.planId === planId,
    ).map((pf) => pf.featureKey);

    return new Set<string>(features);
  }, [activeTenant, getActiveSubscription]);

  const activeModules = useMemo(() => {
    if (!activePlanId) return new Set<PlanModuleKey>();
    return new Set<PlanModuleKey>(PLAN_MODULES_MOCK[activePlanId] ?? []);
  }, [activePlanId]);

  const hasFeature = (featureKey: string) => {
    return activeFeatures.has(featureKey);
  };

  const hasModule = (moduleKey: PlanModuleKey) => {
    return activeModules.has(moduleKey);
  };

  return { activePlanId, activeFeatures, hasFeature, activeModules, hasModule };
}

"use client";

import { usePlanFeaturesContext } from "@/src/components/tenant/plan-features-provider";

export function usePlanFeatures() {
  const { activeFeatures, activeModules, hasFeature, hasModule } =
    usePlanFeaturesContext();

  return {
    activePlanId: null, // Legacy field not needed by sidebar anymore
    activeFeatures,
    hasFeature,
    activeModules,
    hasModule,
  };
}

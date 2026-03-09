"use client";

import React, { createContext, useContext, useMemo } from "react";
import { PlanFeatureKey } from "@/src/types/plan/planFeature";
import { PlanModuleKey } from "@/src/types/plan/type.planModuleKey";
import { ActivePlanFeatures } from "@/src/app/(tenant)/tenant/actions/plan.actions";

type PlanFeaturesContextType = {
  activeFeatures: Set<PlanFeatureKey>;
  activeModules: Set<PlanModuleKey>;
  hasFeature: (featureKey: PlanFeatureKey) => boolean;
  hasModule: (moduleKey: PlanModuleKey) => boolean;
};

const PlanFeaturesContext = createContext<PlanFeaturesContextType | undefined>(
  undefined,
);

export function PlanFeaturesProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData: ActivePlanFeatures;
}) {
  const activeFeatures = useMemo(
    () => new Set(initialData.features),
    [initialData.features],
  );

  const activeModules = useMemo(
    () => new Set(initialData.modules),
    [initialData.modules],
  );

  const hasFeature = (featureKey: PlanFeatureKey) =>
    activeFeatures.has(featureKey);

  const hasModule = (moduleKey: PlanModuleKey) => activeModules.has(moduleKey);

  const value = useMemo(
    () => ({
      activeFeatures,
      activeModules,
      hasFeature,
      hasModule,
    }),
    [activeFeatures, activeModules],
  );

  return (
    <PlanFeaturesContext.Provider value={value}>
      {children}
    </PlanFeaturesContext.Provider>
  );
}

export function usePlanFeaturesContext() {
  const ctx = useContext(PlanFeaturesContext);
  if (ctx === undefined) {
    throw new Error(
      "usePlanFeaturesContext must be used within a PlanFeaturesProvider",
    );
  }
  return ctx;
}

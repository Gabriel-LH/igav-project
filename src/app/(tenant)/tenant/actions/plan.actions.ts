"use server";

import prisma from "@/src/lib/prisma";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { PlanFeatureKey } from "@/src/types/plan/planFeature";
import { PlanModuleKey } from "@/src/types/plan/type.planModuleKey";

export type ActivePlanFeatures = {
  features: PlanFeatureKey[];
  modules: PlanModuleKey[];
};

/**
 * Returns the active plan's features and modules for the current session's tenant.
 * Called server-side in the tenant layout to populate the PlanFeaturesProvider.
 */
export async function getActivePlanFeaturesAction(): Promise<ActivePlanFeatures> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return { features: [], modules: [] };

    // Find the user's active membership to get tenantId
    const membership = await prisma.userTenantMembership.findFirst({
      where: { userId: session.user.id, status: "active" },
      select: { tenantId: true },
    });

    if (!membership) return { features: [], modules: [] };

    const tenantId = membership.tenantId;

    // Find the active subscription for this tenant
    const subscription = await prisma.tenantSubscription.findFirst({
      where: { tenantId, status: "active" },
      select: { planId: true },
    });

    if (!subscription) return { features: [], modules: [] };

    const planId = subscription.planId;

    // Fetch plan features and modules in parallel
    const [planFeatures, planModules] = await Promise.all([
      prisma.planFeature.findMany({
        where: { planId },
        select: { featureKey: true },
      }),
      prisma.planModule.findMany({
        where: { planId },
        select: { moduleKey: true },
      }),
    ]);

    return {
      features: planFeatures.map((f) => f.featureKey as PlanFeatureKey),
      modules: planModules.map((m) => m.moduleKey as PlanModuleKey),
    };
  } catch {
    // Fail open — don't crash the layout if plan data is missing
    return { features: [], modules: [] };
  }
}

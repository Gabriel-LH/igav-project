import { LandingModule } from "@/src/components/landing/landing-module";
import { CrudPlanUseCase } from "@/src/application/superadmin/use-cases/plan/crudPlan.usecase";
import type { PlanWithFeatures } from "@/src/adapters/subscription-adapter";

// Force dynamic so pricing isn't cached strictly at build time
export const dynamic = "force-dynamic";

export default async function Page() {
  const planUseCase = new CrudPlanUseCase();
  const rawPlans = await planUseCase.executeFindAll("system-plans-tenant");

  // Map raw Postgres data (which has nested arrays) into standard PlanWithFeatures objects.
  const plans: PlanWithFeatures[] = rawPlans.map((plan: any) => {
    const moduleKeys = (plan.modules || []).map((m: any) => m.moduleKey);
    const hasSalesModule = moduleKeys.includes("sales");
    const hasRentalsModule = moduleKeys.includes("rentals");
    let mode: "all" | "sales_only" | "rentals_only" | "none" = "none";
    
    if (hasSalesModule && hasRentalsModule) mode = "all";
    else if (hasSalesModule) mode = "sales_only";
    else if (hasRentalsModule) mode = "rentals_only";

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description || undefined,
      priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : 0,
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : 0,
      trialDays: plan.trialDays ?? undefined,
      features: {
        analytics: (plan.features || []).some((f: any) => f.featureKey === "analytics"),
        promotions: (plan.features || []).some((f: any) => f.featureKey === "promotions"),
        referrals: (plan.features || []).some((f: any) => f.featureKey === "referrals"),
        referralRewards: (plan.features || []).some((f: any) => f.featureKey === "referralRewards"),
        loyalty: (plan.features || []).some((f: any) => f.featureKey === "loyalty"),
      },
      limits: {
        users: (plan.limits || []).find((l: any) => l.limitKey === "users")?.limit || 0,
        branches: (plan.limits || []).find((l: any) => l.limitKey === "branches")?.limit || 0,
        products: (plan.limits || []).find((l: any) => l.limitKey === "products")?.limit || 0,
        clients: (plan.limits || []).find((l: any) => l.limitKey === "clients")?.limit || 0,
        inventoryItems: (plan.limits || []).find((l: any) => l.limitKey === "inventoryItems")?.limit || 0,
      },
      modules: {
        sales: hasSalesModule,
        rentals: hasRentalsModule,
        mode,
      },
    };
  });

  return <LandingModule plans={plans} />;
}

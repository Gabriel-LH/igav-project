// src/adapters/subscription-adapter.ts
import { PlanFeature } from "../types/plan/planFeature";
import { PlanLimit } from "../types/plan/type.planLimitKey";
import { Plan } from "../types/plan/planSchema";
import { PlanModulesMap } from "../types/plan/type.planModuleKey";

export interface PlanWithFeatures {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  features: {
    analytics: boolean;
    promotions: boolean;
    referrals: boolean;
    referralRewards: boolean;
    loyalty: boolean;
  };
  limits: {
    users: number;
    branches: number;
    products: number;
    clients: number;
    inventoryItems: number;
  };
  modules: {
    sales: boolean;
    rentals: boolean;
    mode: "all" | "sales_only" | "rentals_only" | "none";
  };
}

export function mapPlansWithFeatures(
  plans: Plan[],
  features: PlanFeature[],
  limits: PlanLimit[],
  planModules: PlanModulesMap = {},
): PlanWithFeatures[] {
  return plans.map(plan => {
    const planFeatures = features.filter(f => f.planId === plan.id);
    const planLimits = limits.filter(l => l.planId === plan.id);
    const modules = planModules[plan.id] ?? [];
    const hasSalesModule = modules.includes("sales");
    const hasRentalsModule = modules.includes("rentals");
    const mode = hasSalesModule && hasRentalsModule
      ? "all"
      : hasSalesModule
        ? "sales_only"
        : hasRentalsModule
          ? "rentals_only"
          : "none";
    
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      features: {
        analytics: planFeatures.some(f => f.featureKey === "analytics"),
        promotions: planFeatures.some(f => f.featureKey === "promotions"),
        referrals: planFeatures.some(f => f.featureKey === "referrals"),
        referralRewards: planFeatures.some(f => f.featureKey === "referralRewards"),
        loyalty: planFeatures.some(f => f.featureKey === "loyalty"),
      },
      limits: {
        users: planLimits.find(l => l.limitKey === "users")?.limit || 0,
        branches: planLimits.find(l => l.limitKey === "branches")?.limit || 0,
        products: planLimits.find(l => l.limitKey === "products")?.limit || 0,
        clients: planLimits.find(l => l.limitKey === "clients")?.limit || 0,
        inventoryItems: planLimits.find(l => l.limitKey === "inventoryItems")?.limit || 0,
      },
      modules: {
        sales: hasSalesModule,
        rentals: hasRentalsModule,
        mode,
      },
    };
  });
}

export function getCurrentUsage() {
  // Esto vendría de tu store/API
  return {
    users: 3,
    branches: 1,
    products: 540,
    clients: 120,
    inventoryItems: 0,
  };
}

export function formatLimit(limit: number): string {
  return limit === -1 ? "Ilimitado" : limit.toString();
}

export function getProgressPercentage(current: number, limit: number): number {
  if (limit === -1) return 0;
  return Math.min(100, Math.round((current / limit) * 100));
}

export function getLimitStatus(current: number, limit: number): "ok" | "warning" | "danger" {
  if (limit === -1) return "ok";
  const percentage = (current / limit) * 100;
  if (percentage >= 90) return "danger";
  if (percentage >= 75) return "warning";
  return "ok";
}

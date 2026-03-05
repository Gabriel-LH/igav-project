import { PlanFeatureKey } from "../types/plan/planFeature";
import { PlanLimitKey } from "../types/plan/type.planLimitKey";
import { PlanModuleKey } from "../types/plan/type.planModuleKey";

export const PLAN_TIERS = ["starter", "pro", "business", "enterprise"] as const;
export const PLAN_TRACKS = ["full", "rentals", "sales"] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];
export type PlanTrack = (typeof PLAN_TRACKS)[number];

export const makePlanId = (tier: PlanTier, track: PlanTrack) =>
  `plan-${tier}-${track}`;

type TierConfig = {
  label: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: PlanFeatureKey[];
  limits: Partial<Record<PlanLimitKey, number>>;
};

const TIER_CONFIG: Record<PlanTier, TierConfig> = {
  starter: {
    label: "Starter",
    description: "Para negocios que recién comienzan",
    priceMonthly: 9,
    priceYearly: 90,
    features: ["inventory", "products", "clients", "payments"],
    limits: { users: 2, branches: 1, products: 200, clients: 500, inventoryItems: 200 },
  },
  pro: {
    label: "Pro",
    description: "Para negocios en crecimiento",
    priceMonthly: 29,
    priceYearly: 290,
    features: ["inventory", "products", "clients", "payments", "analytics", "promotions"],
    limits: {
      users: 5,
      branches: 2,
      products: 1000,
      clients: 2000,
      inventoryItems: 1000,
    },
  },
  business: {
    label: "Business",
    description: "Para empresas consolidadas",
    priceMonthly: 79,
    priceYearly: 790,
    features: [
      "inventory",
      "products",
      "clients",
      "payments",
      "analytics",
      "promotions",
      "referrals",
      "userAttendance",
      "users",
      "branches",
    ],
    limits: { users: 15, branches: 5, products: -1, clients: -1, inventoryItems: -1 },
  },
  enterprise: {
    label: "Enterprise",
    description: "Para grandes corporaciones",
    priceMonthly: 199,
    priceYearly: 1990,
    features: [
      "inventory",
      "products",
      "clients",
      "payments",
      "analytics",
      "promotions",
      "referrals",
      "referralRewards",
      "loyalty",
      "userAttendance",
      "users",
      "branches",
      "permissions",
      "tenants",
      "inventoryItems",
      "subscriptions",
    ],
    limits: {
      users: -1,
      branches: -1,
      products: -1,
      clients: -1,
      inventoryItems: -1,
      promotions: -1,
      analytics: -1,
      referrals: -1,
      referralRewards: -1,
      loyalty: -1,
      subscriptions: -1,
    },
  },
};

const TRACK_CONFIG: Record<
  PlanTrack,
  {
    label: string;
    modules: PlanModuleKey[];
    moduleFeatures: PlanFeatureKey[];
    priceMultiplier: number;
    limitMultiplier: number;
  }
> = {
  full: {
    label: "Sistema Completo",
    modules: ["sales", "rentals"],
    moduleFeatures: ["sales", "rentals"],
    priceMultiplier: 1,
    limitMultiplier: 1,
  },
  rentals: {
    label: "Solo Alquiler",
    modules: ["rentals"],
    moduleFeatures: ["rentals"],
    priceMultiplier: 0.7,
    limitMultiplier: 0.8,
  },
  sales: {
    label: "Solo Ventas",
    modules: ["sales"],
    moduleFeatures: ["sales"],
    priceMultiplier: 0.7,
    limitMultiplier: 0.8,
  },
};

const scaleLimit = (limit: number, multiplier: number) => {
  if (limit <= 0) return limit;
  return Math.max(1, Math.round(limit * multiplier));
};

export function getPlanMatrixData() {
  return PLAN_TRACKS.flatMap((track, trackIndex) =>
    PLAN_TIERS.map((tier, tierIndex) => {
      const tierCfg = TIER_CONFIG[tier];
      const trackCfg = TRACK_CONFIG[track];
      const id = makePlanId(tier, track);

      const features = [...new Set([...tierCfg.features, ...trackCfg.moduleFeatures])];
      const limits = Object.entries(tierCfg.limits).map(([limitKey, limit]) => ({
        limitKey: limitKey as PlanLimitKey,
        limit: scaleLimit(limit as number, trackCfg.limitMultiplier),
      }));

      return {
        id,
        name: `${tierCfg.label} - ${trackCfg.label}`,
        description: `${tierCfg.description}. Modalidad: ${trackCfg.label.toLowerCase()}`,
        priceMonthly: Math.round(tierCfg.priceMonthly * trackCfg.priceMultiplier),
        priceYearly: Math.round(tierCfg.priceYearly * trackCfg.priceMultiplier),
        sortOrder: trackIndex * PLAN_TIERS.length + tierIndex + 1,
        modules: trackCfg.modules,
        features,
        limits,
      };
    }),
  );
}

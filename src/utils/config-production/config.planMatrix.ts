import { PlanFeatureKey } from "../../types/plan/planFeature";
import { PlanLimitKey } from "../../types/plan/type.planLimitKey";
import { PlanModuleKey } from "../../types/plan/type.planModuleKey";

// 3 tiers × 3 tracks = 9 plans
export const PLAN_TIERS = ["starter", "business", "enterprise"] as const;
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

/**
 * Tier feature matrix:
 *
 * | Feature           | Starter | Business | Enterprise |
 * |-------------------|---------|----------|------------|
 * | sales/rentals     |   ✅    |    ✅    |     ✅     |
 * | inventory/products|   ✅    |    ✅    |     ✅     |
 * | clients/payments  |   ✅    |    ✅    |     ✅     |
 * | users             |   ✅    |    ✅    |     ✅     |
 * | branches          |   ❌    |    ✅    |     ✅     |
 * | userAttendance    |   ❌    |    ✅    |     ✅     |
 * | shifts            |   ❌    |    ✅    |     ✅     |
 * | payroll           |   ❌    |    ❌    |     ✅     |
 * | analytics/reports |   ❌    |    ✅    |     ✅     |
 * | promotions        |   ❌    |    ✅    |     ✅     |
 * | permissions       |   ❌    |    ✅    |     ✅     |
 * | referrals         |   ❌    |    ❌    |     ✅     |
 * | referralRewards   |   ❌    |    ❌    |     ✅     |
 * | loyalty           |   ❌    |    ❌    |     ✅     |
 */
const TIER_CONFIG: Record<PlanTier, TierConfig> = {
  starter: {
    label: "Starter",
    description: "Para negocios que recién comienzan",
    priceMonthly: 19,
    priceYearly: 190,
    features: [
      "sales",
      "rentals",
      "reservations",
      "inventory",
      "products",
      "inventoryItems",
      "clients",
      "payments",
      "users",
    ],
    limits: {
      users: 3,
      branches: 1,
      products: 200,
      clients: 500,
      inventoryItems: 200,
    },
  },

  business: {
    label: "Business",
    description: "Para empresas en crecimiento",
    priceMonthly: 59,
    priceYearly: 590,
    features: [
      "sales",
      "rentals",
      "reservations",
      "inventory",
      "products",
      "inventoryItems",
      "clients",
      "payments",
      "users",
      "branches",
      "userAttendance",
      "shifts",
      "analytics",
      "reports",
      "promotions",
      "permissions",
    ],
    limits: {
      users: 15,
      branches: 5,
      products: 2000,
      clients: 5000,
      inventoryItems: 2000,
    },
  },

  enterprise: {
    label: "Enterprise",
    description: "Para grandes corporaciones sin límites",
    priceMonthly: 149,
    priceYearly: 1490,
    features: [
      "sales",
      "rentals",
      "reservations",
      "inventory",
      "products",
      "inventoryItems",
      "clients",
      "payments",
      "users",
      "branches",
      "userAttendance",
      "shifts",
      "payroll",
      "analytics",
      "reports",
      "promotions",
      "referrals",
      "referralRewards",
      "loyalty",
      "permissions",
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
  if (limit <= 0) return limit; // -1 means unlimited
  return Math.max(1, Math.round(limit * multiplier));
};

export function getPlanMatrixData() {
  return PLAN_TRACKS.flatMap((track, trackIndex) =>
    PLAN_TIERS.map((tier, tierIndex) => {
      const tierCfg = TIER_CONFIG[tier];
      const trackCfg = TRACK_CONFIG[track];
      const id = makePlanId(tier, track);

      // Merge tier features + track-specific module features (deduplicated)
      const features = [
        ...new Set([...tierCfg.features, ...trackCfg.moduleFeatures]),
      ];

      const limits = Object.entries(tierCfg.limits).map(
        ([limitKey, limit]) => ({
          limitKey: limitKey as PlanLimitKey,
          limit: scaleLimit(limit as number, trackCfg.limitMultiplier),
        }),
      );

      return {
        id,
        name: `${tierCfg.label} - ${trackCfg.label}`,
        description: `${tierCfg.description}. Modalidad: ${trackCfg.label.toLowerCase()}`,
        priceMonthly: Math.round(
          tierCfg.priceMonthly * trackCfg.priceMultiplier,
        ),
        priceYearly: Math.round(tierCfg.priceYearly * trackCfg.priceMultiplier),
        sortOrder: trackIndex * PLAN_TIERS.length + tierIndex + 1,
        modules: trackCfg.modules,
        features,
        limits,
      };
    }),
  );
}

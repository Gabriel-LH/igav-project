import z from "zod";

export const PLAN_FEATURE_KEYS = [
  "home",
  "dashboard",
  "analytics",
  "pos",
  "sales",
  "rentals",
  "returns",
  "reservations",
  "inventory",
  "users",
  "roles",
  "tenants",
  "branches",
  "clients",
  "products",
  "promotions",
  "referrals",
  "payments",
  "referralRewards",
  "userAttendance",
  "userBranchAccess",
  "userTenantMembership",
  "permissions",
  "settings",
  "policies",
  "shifts",
] as const;

export const PlanFeatureKeySchema = z.enum(PLAN_FEATURE_KEYS);

export type PlanFeatureKey = z.infer<typeof PlanFeatureKeySchema>;

export const PlanFeatureSchema = z.object({
  id: z.string(),
  planId: z.string(),
  featureKey: PlanFeatureKeySchema,
});

export type PlanFeature = z.infer<typeof PlanFeatureSchema>;

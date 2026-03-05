import z from "zod";

export const PLAN_FEATURE_KEYS = [
  "sales",
  "rentals",
  "inventory",
  "products",
  "payments",
  "userAttendance",
  "users",
  "branches",
  "permissions",
  "tenants",
  "analytics",
  "promotions",
  "referrals",
  "reservations",
  "referralRewards",
  "loyalty",
  "clients",
  "inventoryItems",
  "subscriptions",
] as const;

export const PlanFeatureKeySchema = z.enum(PLAN_FEATURE_KEYS);

export type PlanFeatureKey = z.infer<typeof PlanFeatureKeySchema>;

export const PlanFeatureSchema = z.object({
  id: z.string(),
  planId: z.string(),
  featureKey: PlanFeatureKeySchema,
});

export type PlanFeature = z.infer<typeof PlanFeatureSchema>;

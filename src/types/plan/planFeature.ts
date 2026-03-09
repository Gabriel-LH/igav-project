import z from "zod";

export const PLAN_FEATURE_KEYS = [
  // Operations
  "sales",
  "rentals",
  // Inventory
  "inventory",
  "products",
  "inventoryItems",
  // Clients
  "clients",
  // Payments
  "payments",
  // RRHH
  "users",
  "branches",
  "userAttendance",
  "shifts",
  "payroll",
  "permissions",
  // Analytics
  "analytics",
  "reports",
  // Marketing
  "promotions",
  "referrals",
  "referralRewards",
  "loyalty",
  // System (superadmin-only features)
  "tenants",
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

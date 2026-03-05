import z from "zod";

export const PLAN_LIMIT_KEYS = [
  "users",
  "branches",
  "products",
  "clients",
  "inventoryItems",
  "promotions",
  "analytics",
  "referrals",
  "referralRewards",
  "loyalty",
  "subscriptions",
] as const;

export const PlanLimitKeySchema = z.enum(PLAN_LIMIT_KEYS);
export type PlanLimitKey = z.infer<typeof PlanLimitKeySchema>;

export const planLimitSchema = z.object({
  id: z.string(),
  planId: z.string(),

  limitKey: PlanLimitKeySchema,

  limit: z.number().min(-1), // -1 puede significar ilimitado, 0 bloqueado, >0 limite 
});

export type PlanLimit = z.infer<typeof planLimitSchema>;

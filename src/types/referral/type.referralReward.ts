import z from "zod";

export const referralRewardSchema = z.object({
  id: z.string(),
  tenantId: z.string(),

  referralId: z.string(),

  rewardType: z.enum(["wallet_credit", "discount_coupon", "loyalty_points"]),
  amount: z.number(),

  status: z.enum(["pending", "available", "used", "expired"])
    .default("pending"),

  ledgerEntryId: z.string().optional(),
  triggeredByOperationId: z.string().optional(),

  createdAt: z.date(),
  usedAt: z.date().nullable().default(null),
});

export type ReferralReward = z.infer<typeof referralRewardSchema>;
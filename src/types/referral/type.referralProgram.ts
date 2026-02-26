import z from "zod";

export const referralProgramSchema = z.object({
  id: z.string(),
  tenantId: z.string(),

  isActive: z.boolean().default(true),

  rewardType: z.enum(["wallet_credit", "discount_coupon", "loyalty_points"]),
  rewardValue: z.number(),

  triggerCondition: z.enum(["first_purchase", "first_payment"]),

  expiresInDays: z.number().optional(),

  createdAt: z.date(),
});

export type ReferralProgram = z.infer<typeof referralProgramSchema>;

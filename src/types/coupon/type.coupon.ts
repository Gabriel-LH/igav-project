// src/domain/coupon/coupon.schema.ts

import z from "zod";

export const couponSchema = z.object({
  id: z.string(),
  tenantId: z.string(),

  code: z.string(),

  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.number(),

  minPurchaseAmount: z.number().optional(),

  assignedToClientId: z.string(),

  origin: z.enum(["referral", "promotion", "birthday", "manual_adjustment"]),

  originReferenceId: z.string().optional(), // referralId, campaignId, etc

  status: z.enum(["available", "used", "expired"]).default("available"),

  expiresAt: z.date().nullable(),

  createdAt: z.date(),
  usedAt: z.date().nullable().default(null),
});

export type Coupon = z.infer<typeof couponSchema>;

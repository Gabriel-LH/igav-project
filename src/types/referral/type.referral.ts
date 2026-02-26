import z from "zod";

export const referralSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),

  referrerClientId: z.string(),
  referredClientId: z.string(),

  status: z.enum(["pending", "qualified", "rewarded"]),

  createdAt: z.date()
});

export type Referral = z.infer<typeof referralSchema>;

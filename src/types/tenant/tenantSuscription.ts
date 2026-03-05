import z from "zod";

export const TenantSubscriptionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  planId: z.string(),
  status: z.enum(["trial","active", "past_due", "canceled"]),
  billingCycle: z.enum(["monthly", "yearly"]),
  startedAt: z.date(),
  trialEndsAt: z.date().optional(),

  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),

  provider: z.enum(["paypal", "mercadopago", "manual"]),
  externalSubscriptionId: z.string().optional(),

  canceledAt: z.date().optional(),
});

export type TenantSubscription = z.infer<typeof TenantSubscriptionSchema>;

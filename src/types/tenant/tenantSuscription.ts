import z from "zod";

export const TenantSubscriptionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  planId: z.string(),
  status: z.enum(["active", "past_due", "canceled"]),
  startedAt: z.date(),
  endsAt: z.date().optional(),
});

export type TenantSubscription = z.infer<typeof TenantSubscriptionSchema>;

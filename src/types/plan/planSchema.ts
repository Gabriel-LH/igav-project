import z from "zod";

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  currency: z.string().default("PEN"),
  priceMonthly: z.number().nonnegative(),
  trialDays: z.number().optional(),
  priceYearly: z.number().nonnegative().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  createdAt: z.date(),
});

export type Plan = z.infer<typeof PlanSchema>;

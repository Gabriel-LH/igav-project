import z from "zod";

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  priceMonthly: z.number().nonnegative(),
  priceYearly: z.number().nonnegative().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date()
});
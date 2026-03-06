import z from "zod";

export const moduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priceMonthly: z.number().optional(),
  isActive: z.boolean(),
});

export type Module = z.infer<typeof moduleSchema>
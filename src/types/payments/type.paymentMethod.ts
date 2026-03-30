import { z } from "zod";

export const paymentMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["cash", "digital", "card", "transfer", "check", "other"]),
  active: z.boolean().default(true),
  allowsChange: z.boolean().default(false),
  requiresPin: z.boolean().default(false),
  icon: z.string().optional(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
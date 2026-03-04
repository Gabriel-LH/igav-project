import { z } from "zod";

export const transferItemSchema = z.object({
  id: z.string(),

  transferId: z.string(),

  productId: z.string(),
  variantId: z.string().optional(),

  quantitySent: z.number(),
  quantityReceived: z.number().optional(),

  createdAt: z.date(),
});

export type TransferItem = z.infer<typeof transferItemSchema>;

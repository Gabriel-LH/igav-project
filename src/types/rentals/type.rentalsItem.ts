// src/types/rental/type.rentalItem.ts
import z from "zod";
import { rentalItemStatusHistorySchema } from "./rentalItemStatusHistory";

export const rentalItemSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  rentalId: z.string(),
  operationId: z.string(),

  productId: z.string(),
  stockId: z.string(),
  inventoryItemId: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.string().optional(),
  ),
  stockLotId: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.string().optional(),
  ),

  variantId: z.string(),
  priceAtMoment: z.number(),
  quantity: z.number().default(1),

  conditionOut: z.string(),
  conditionIn: z.string().optional(),

  isDamaged: z.boolean().default(false),
  damageNotes: z.string().optional(),

  discountAmount: z.number().default(0),
  discountReason: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.string().optional(),
  ),
  bundleId: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.string().optional(),
  ),
  promotionId: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.string().optional(),
  ),

  productName: z.string().optional(),
  variantCode: z.string().optional(),
  serialCode: z.string().optional(),
  isSerial: z.boolean().optional(),

  notes: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.string().optional(),
  ),
  listPrice: z.number(),
  itemStatus: z.enum([
    "alquilado",
    "devuelto",
    "en_lavanderia",
    "en_mantenimiento",
    "baja",
  ]),
});

export type RentalItem = z.infer<typeof rentalItemSchema>;

export const rentalItemWithHistorySchema = rentalItemSchema.extend({
  statusHistory: z.array(rentalItemStatusHistorySchema),
});

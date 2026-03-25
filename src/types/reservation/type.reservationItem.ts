import z from "zod";
import { reservationItemStatusHistorySchema } from "./type.reservationItemStatusHistory";

export const reservationItemSchema = z.object({
  id: z.string(),
  operationId: z.string().optional(), //Dejamos si queremos hacer consultas súper rápidas sin pasar por la reserva
  productId: z.string(), // El ID del vestido/traje
  stockId: z.string().optional(),
  inventoryItemId: z.string().optional(),
  reservationId: z.string(), // Conecta con la Reserva madre
  variantId: z.string(),
  isSerial: z.boolean().default(false),

  // Aquí movimos lo que tenías en "details"
  quantity: z.number().min(1),
  priceAtMoment: z.number(),
  listPrice: z.number().optional(),
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
  notes: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.string().optional(),
  ),

  // --- ESTADO DE LA RESERVA DEL ITEM ---
  itemStatus: z.enum(["confirmada", "cancelada", "convertida", "expirada"]), //expirada se usara para volver a disponible el stock automaticamente
});

export type ReservationItem = z.infer<typeof reservationItemSchema>;

export const reservationItemWithHistorySchema = reservationItemSchema.extend({
  statusHistory: z.array(reservationItemStatusHistorySchema),
});
export type ReservationItemWithHistory = z.infer<
  typeof reservationItemWithHistorySchema
>;

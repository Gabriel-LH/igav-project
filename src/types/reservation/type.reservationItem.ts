import z from "zod";

export const reservationItemSchema = z.object({
  id: z.string(),
  operationId: z.string().optional(), //Dejamos si queremos hacer consultas súper rápidas sin pasar por la reserva
  productId: z.string(), // El ID del vestido/traje
  stockId: z.string().optional(),
  reservationId: z.string(), // Conecta con la Reserva madre

  // Aquí movimos lo que tenías en "details"
  quantity: z.number().min(1),
  size: z.string(),
  color: z.string(),
  priceAtMoment: z.number(),
  notes: z.string().optional(),

  // --- ESTADO DE LA RESERVA DEL ITEM ---
  itemStatus: z.enum(["confirmada", "cancelada", "convertida", "expirada"]), //expirada se usara para volver a disponible el stock automaticamente
});

export type ReservationItem = z.infer<typeof reservationItemSchema>;

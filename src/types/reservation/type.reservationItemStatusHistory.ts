import z from "zod";

export const reservationItemStatusHistorySchema = z.object({
  id: z.string(),
  reservationItemId: z.string(),
  fromStatus: z.enum(["confirmada","cancelada","convertida","expirada"]),
  toStatus: z.enum(["confirmada","cancelada","convertida","expirada"]),
  reason: z.string().optional(),       // Ej: "cliente no llegó", "convertido a alquiler"
  changedBy: z.string().optional(),
  createdAt: z.date(),
});

export type ReservationItemStatusHistory = z.infer<typeof reservationItemStatusHistorySchema>;
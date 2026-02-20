import z from "zod";

export const rentalItemStatusHistorySchema = z.object({
  id: z.string(),
  rentalItemId: z.string(),
  fromStatus: z.enum(["alquilado","devuelto","en_lavanderia","en_mantenimiento","baja"]),
  toStatus: z.enum(["alquilado","devuelto","en_lavanderia","en_mantenimiento","baja"]),
  reason: z.string().optional(),
  changedBy: z.string().optional(),
  createdAt: z.date(),
});
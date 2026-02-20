import z from "zod";

export const rentalStatusHistorySchema = z.object({
  id: z.string(),
  rentalId: z.string(),
  fromStatus: z.enum(["alquilado","devuelto","reservado_fisico","atrasado","con_daños","perdido","anulado"]),
  toStatus: z.enum(["alquilado","devuelto","reservado_fisico","atrasado","con_daños","perdido","anulado"]),
  reason: z.string().optional(),
  changedBy: z.string().optional(),
  createdAt: z.date(),
});
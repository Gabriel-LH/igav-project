import z from "zod";

export const operationSchema = z.object({
  id: z.number(),
  productId: z.number(), // Relación
  type: z.enum(["alquiler", "venta", "reserva"]),
  quantity: z.number(),
  total: z.number(),
  customer: z.string(),
  date: z.date(),
});
import { z } from "zod";

export const paymentSchema = z.object({
  id: z.string().uuid(),
  operationId: z.number(),
  branchId: z.string().uuid(), // Sucursal donde se recibió el dinero
  receivedById: z.string().uuid(), // ID del usuario que cobró
  amount: z.number().positive(),
  method: z.enum(["efectivo", "transferencia", "tarjeta", "qr", "cheque", "deposito", "yape", "plin"]),
  type: z.enum(["adelanto", "cuota", "saldo_total", "garantia"]),
  reference: z.string().optional(),
  date: z.date(),
});
export type Payment = z.infer<typeof paymentSchema>;
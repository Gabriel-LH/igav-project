import { z } from "zod";

export const paymentSchema = z.object({
  id: z.string(),
  operationId: z.number(),
  branchId: z.string(), // Sucursal donde se recibió el dinero
  receivedById: z.string(), // ID del usuario que cobró
  amount: z.number().positive(),
  receivedAmount: z.number().optional(), // Lo que el cliente entregó (ej: un billete de 100)
  changeAmount: z.number().optional(),   // El vuelto que se le dio (ej: 15)
  method: z.enum(["efectivo", "transferencia", "tarjeta", "qr", "cheque", "deposito", "yape", "plin"]),
  type: z.enum(["adelanto", "cuota", "saldo_total", "garantia"]),
  reference: z.string().optional(),
  date: z.date(),
});
export type Payment = z.infer<typeof paymentSchema>;
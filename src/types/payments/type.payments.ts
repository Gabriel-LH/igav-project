import { z } from "zod";

// Cómo entró el dinero
export const paymentSchema = z.object({
  id: z.string(),
  operationId: z.string(),
  branchId: z.string(), // Sucursal donde se recibió el dinero
  receivedById: z.string(), // ID del usuario que cobró
  amount: z.number().positive(),
  receivedAmount: z.number().optional(), // Lo que el cliente entregó (ej: un billete de 100)
  changeAmount: z.number().optional(), // El vuelto que se le dio (ej: 15)
  method: z.enum(["cash", "card", "transfer", "yape", "plin"]),
  type: z.enum(["adelanto", "cuota", "saldo_total"]),
  status: z
    .enum(["pendiente", "completado", "reembolsado", "anulado"])
    .default("pendiente"),
  reference: z.string().optional(),
  date: z.date(),
});
export type Payment = z.infer<typeof paymentSchema>;

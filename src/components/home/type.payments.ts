import { z } from "zod";

export const paymentSchema = z.object({
  id: z.string(),
  operationId: z.number(), // Conecta con la operación
  amount: z.number(),      // Cuánto pagó en esta cuota
  method: z.enum(["efectivo", "transferencia", "tarjeta"]),
  reference: z.string().optional(), // Número de comprobante o transferencia
  date: z.date(),
  receivedBy: z.string(),  // Quién atendió (nombre del empleado)
});

export type Payment = z.infer<typeof paymentSchema>;
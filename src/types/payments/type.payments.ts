import { z } from "zod";

export const paymentSchema = z.object({
  id: z.string(),

  // Relación
  operationId: z.string(),
  branchId: z.string(),
  receivedById: z.string(),

  // Movimiento financiero
  amount: z.number().positive(),
  direction: z.enum(["in", "out"]), // Registro de entrada o salida
  method: z.enum(["cash", "card", "transfer", "yape", "plin"]),

  // Estado contable
  status: z.enum(["pending", "posted"]).default("pending"),

  // Clasificación del movimiento
  category: z.enum([
    "payment", // cliente paga
    "refund", // devolución
    "correction", // corrección administrativa
  ]),

  originalPaymentId: z.string().optional(),

  // Metadatos
  reference: z.string().optional(),
  date: z.date(),
  notes: z.string().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;
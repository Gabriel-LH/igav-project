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
  paymentMethodId: z.string(),
  cashSessionId: z.string().optional(),

  createdAt: z.date(), //timestamp real del sistema cajero registra 00:02

  currency: z.string().default("PEN"),

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
  date: z.date(), //fecha del movimiento cliente paga 23:59
  notes: z.string().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;

import z from "zod";

export const paymentTableSchema = z.object({
  id: z.string(),

  clientName: z.string(),
  operationType: z.string(),
  receivedBy: z.string(),

  totalAmount: z.number(),

  // Movimiento real
  amount: z.number(),
  direction: z.enum(["in", "out"]),
  category: z.enum(["payment", "refund", "correction"]),
  status: z.enum(["pending", "posted"]),

  // Métricas derivadas (Históricas)
  netPaid: z.number(),
  remaining: z.number(),

  // 🌟 NUEVOS CAMPOS PRO (Actuales)
  currentRemaining: z.number(),
  hasSubsequentCorrections: z.boolean(),

  date: z.date(),
  method: z.string(),

  reference: z.string().optional(),
  notes: z.string().optional(),
});

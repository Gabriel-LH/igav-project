import z from "zod";

export const saleChargeSchema = z.object({
  id: z.string(),

  saleId: z.string(),
  saleItemId: z.string().optional(), // Si aplica a un item específico
  operationId: z.string(), // Conecta con flujo financiero

  type: z.enum([
    "restocking_fee",
    "damage",
    "cleaning",
    "admin_fee",
    "late_return",
    "other",
  ]),

  description: z.string(),

  amount: z.number(),

  status: z.enum(["pending", "paid", "cancelled"]),

  createdAt: z.date(),
  createdBy: z.string().optional(),
});

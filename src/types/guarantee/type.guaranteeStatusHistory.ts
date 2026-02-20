import z from "zod";

export const guaranteeStatusHistorySchema = z.object({
  id: z.string(),
  guaranteeId: z.string(),
  fromStatus: z.enum(["pendiente", "liberada", "custodia", "devuelta", "retenida"]),
  toStatus: z.enum(["pendiente", "liberada", "custodia", "devuelta", "retenida"]),
  reason: z.string().optional(),
  changedBy: z.string().optional(),
  createdAt: z.date(),
});

export type GuaranteeStatusHistory = z.infer<typeof guaranteeStatusHistorySchema>;
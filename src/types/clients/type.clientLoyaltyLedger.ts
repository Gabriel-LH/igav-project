import { z } from "zod";

export const clientLoyaltyLedgerSchema = z.object({
  id: z.string(),
  clientId: z.string(),

  amount: z.number().positive(),
  direction: z.enum(["credit", "debit"]),

  type: z.enum([
    "earned_purchase", // Ganado por compra
    "redeemed", // Canjeado
    "expired", // Vencido (limpieza anual)
    "manual_adjustment", // Regalo del admin
    "bonus_referral", // Por invitar a un amigo
  ]),

  status: z.enum(["confirmed", "voided"]).default("confirmed"),

  operationId: z.string().optional(), // ID de la venta donde ganó/gastó
  description: z.string().optional(), // "Puntos x Alquiler Terno"

  createdBy: z.string().optional(),
  createdAt: z.date(),
  expiresAt: z.date().optional(), // Opcional: Si los puntos vencen en 1 año
});

export type ClientLoyaltyLedger = z.infer<typeof clientLoyaltyLedgerSchema>;

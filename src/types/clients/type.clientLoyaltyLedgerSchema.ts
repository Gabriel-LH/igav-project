import { z } from "zod";

export const clientLoyaltyLedgerSchema = z.object({
  id: z.string(),
  clientId: z.string(),

  amount: z.number().int(),
  // + positivo = ganó puntos (compra)
  // - negativo = gastó puntos (canje)

  type: z.enum([
    "earned_purchase", // Ganado por compra
    "redeemed", // Canjeado
    "expired", // Vencido (limpieza anual)
    "manual_adjustment", // Regalo del admin
    "bonus_referral", // Por invitar a un amigo
  ]),

  operationId: z.string().optional(), // ID de la venta donde ganó/gastó
  description: z.string().optional(), // "Puntos x Alquiler Terno"

  createdAt: z.date(),
  expiresAt: z.date().optional(), // Opcional: Si los puntos vencen en 1 año
});

export type ClientLoyaltyLedger = z.infer<typeof clientLoyaltyLedgerSchema>;

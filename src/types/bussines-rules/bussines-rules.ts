import { z } from "zod";
import { transferRouteSchema } from "./transfer-route";

export const businessRulesSchema = z.object({
  defaultTransferTime: z.number(),
  transferRoutes: z.array(transferRouteSchema), // <-- Aquí unimos los esquemas

  // Reglas de multas (Moras)
  penaltyPerDay: z.number(),

  // Reglas de tiempo para una un pendiente_entrega
  maxDaysRental: z.number(),
  maxDaysSale: z.number(),
  openHours: z.object({
    open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  }),
  daysInLaundry: z.number(), // Ej: 2 días lavando y secando
  daysInMaintenance: z.number(), // Ej: 1 día cosiendo botones/bastas
  // Reglas de daños (Penalizaciones)
  stainPenalty: z.number(),
  lostButtonPenalty: z.number(),
  lostHangerPenalty: z.number(),

  // Puedes agregar más reglas como:
  currency: z.string().default("PEN"),
  taxRate: z.number().default(0.18), // Ejemplo: IGV/IVA

  // 🛡️ REGLAS DE SEGURIDAD PARA DESCUENTOS
  maxDiscountPercentageAllowed: z.number(), // Ej: 0.30 (Nadie puede dar más del 30% manual)
  requireAdminAuthForDiscountOver: z.number(), // Ej: 0.15 (Si pasa del 15%, pide clave de gerente)
  allowStackingDiscounts: z.boolean(), // ¿Se puede sumar cupón + descuento manual? (False recomendado)

  // 🏆 REGLAS DE FIDELIZACIÓN
  loyalty: z.object({
    enabled: z.boolean(),

    // GANAR: Por cada S/ 10 de compra, gana 1 punto
    earnRate: z.number(), // Ej: 0.1 (10% del valor en puntos) o divisor (1 punto cada 10 soles)

    // GASTAR: Cada punto vale S/ 0.50 de descuento
    redemptionValue: z.number(), // Ej: 0.50

    // Mínimo de puntos para canjear
    minPointsToRedeem: z.number().default(100),
    expirePointsAfterDays: z.number().optional(),
  }),
});

export type BusinessRules = z.infer<typeof businessRulesSchema>;

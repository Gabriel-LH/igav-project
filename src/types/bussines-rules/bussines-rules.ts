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
    open: z.number(),
    close: z.number(),
  }),
  
  // Reglas de daños (Penalizaciones)
  stainPenalty: z.number(),
  lostButtonPenalty: z.number(),
  lostHangerPenalty: z.number(),
  
  // Puedes agregar más reglas como:
  currency: z.string().default("USD"),
  taxRate: z.number().default(0.18), // Ejemplo: IGV/IVA
});

export type BusinessRules = z.infer<typeof businessRulesSchema>;

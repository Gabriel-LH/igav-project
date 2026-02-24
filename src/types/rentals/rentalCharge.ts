import z from "zod";

export const rentalChargeSchema = z.object({
  id: z.string(),

  // Relaciones
  rentalId: z.string(),          // A qué contrato pertenece
  rentalItemId: z.string().optional(), // Si el cargo es por un item específico
  operationId: z.string(),       // Conecta con el flujo financiero

  // Tipo de cargo
  type: z.enum([
    "damage",          // Daño físico
    "late_fee",        // Penalidad por atraso
    "loss",            // Pérdida total
    "cleaning",        // Limpieza especial
    "repair",          // Reparación
    "other",
  ]),

  description: z.string(),

  // Financiero
  amount: z.number(),             // Monto total del cargo
  guaranteeCoveredAmount: z.number().default(0), // Parte cubierta por garantía
  remainingAmount: z.number().default(0),        // Parte pendiente de pago

  status: z.enum([
    "pending",     // Aún no pagado
    "covered",     // Totalmente cubierto por garantía
    "partially_paid",
    "paid",
    "cancelled",
  ]),

  createdAt: z.date(),
  createdBy: z.string().optional(),
});
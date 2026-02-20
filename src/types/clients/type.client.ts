import { z } from "zod";
import { paymentSchema } from "../payments/type.payments";

// Relación financiera global (crédito/deuda)
export const clientSchema = z.object({
  id: z.string(),
  userName: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  dni: z.string(),
  email: z.string().optional(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  province: z.string().optional(),
  zipCode: z.string().optional(),
  type: z.enum(["individual", "company"]).default("individual"),

  // Dinero real a favor del cliente (por devoluciones o vueltos)
  walletBalance: z.number().default(0),

  // Puntos acumulados por compras (gamificación)
  loyaltyPoints: z.number().default(0),

  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  //Soft delete
  isDeleted: z.boolean().default(false),
  deletedAt: z.date().nullable().default(null),
  deletedBy: z.string().nullable().default(null),
  deleteReason: z.string().nullable().default(null),

  status: z.enum(["active", "inactive", "suspended", "blocked"]),
  internalNotes: z.string().optional(),

  metadata: z.record(z.string(), z.any()).optional(),
});

export type Client = z.infer<typeof clientSchema>;

export const clientWithDetailsSchema = clientSchema.extend({
  payments: z.array(paymentSchema),
  calculated: z.object({
    totalPaid: z.number(),
    remainingBalance: z.number(),
    totalDebt: z.number(), // Deuda Actual: Cuánto nos debe (Mora + Alquileres abiertos)

    // Opcional: Puedes exponer el wallet aquí también para facilitar el frontend
    availableCredit: z.number(),
  }),
});

export type ClientWithDetails = z.infer<typeof clientWithDetailsSchema>;

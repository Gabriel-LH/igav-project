import { z } from "zod";

export const clientAllSchema = z.object({
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

  // Dinero real a favor del cliente (por devoluciones o vueltos)
  walletBalance: z.number().default(0),

  // Puntos acumulados por compras (gamificación)
  loyaltyPoints: z.number().int().default(0),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
  status: z.enum(["active", "inactive"]),
});
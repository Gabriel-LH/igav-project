import { z } from "zod";
import { paymentSchema } from "../payments/type.payments";

// Relación financiera global (crédito/deuda)
export const clientSchema = z.object({
  id: z.string(),
  userName: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  dni: z.string(),
  email: z.string().email().optional(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  province: z.string().optional(),
  zipCode: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
  status: z.enum(["active", "inactive"]),
});

export type Client = z.infer<typeof clientSchema>;

export const clientWithDetailsSchema = clientSchema.extend({
  payments: z.array(paymentSchema),
  calculated: z.object({
    totalPaid: z.number(),
    remainingBalance: z.number(),
  })
});

export type ClientWithDetails = z.infer<typeof clientWithDetailsSchema>;

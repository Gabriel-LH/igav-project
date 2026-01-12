import z from "zod";
import { Payment, paymentSchema } from "../payments/type.payments";

export const operationSchema = z.object({
  id: z.number(),
  branchId: z.string(), // ¡NUEVO! Dónde se hizo la transacción
  sellerId: z.string(), // ¡NUEVO! Quién la hizo (userSchema.id)
  customerId: z.string(),
  reservationId: z.string().optional(),
  type: z.enum(["alquiler", "venta", "reserva"]),
  status: z.enum(["pendiente", "en_progreso", "completado", "cancelado"]),
  paymentStatus: z.enum(["pendiente", "parcial", "pagado"]),
  totalAmount: z.number().min(0),
  date: z.date(),
  createdAt: z.date(),
});

export type Operation = z.infer<typeof operationSchema>;

export const operationWithDetailsSchema = operationSchema.extend({
  payments: z.array(paymentSchema),
  calculated: z.object({
    totalPaid: z.number(),
    remainingBalance: z.number(),
  })
});

export type OperationWithDetails = z.infer<typeof operationWithDetailsSchema>;
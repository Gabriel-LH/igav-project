import z from "zod";
import { rentalItemSchema } from "./type.rentalsItem";
import { rentalStatusHistorySchema } from "./rentalStatusHistory";
import { rentalChargeSchema } from "./rentalCharge";

export const rentalSchema = z.object({
  id: z.string(),
  operationId: z.string(), // Conecta con la transacción financiera
  reservationId: z.string().optional(), // Puede venir de una reserva o ser alquiler directo
  customerId: z.string(),
  branchId: z.string(),

  // Control de Tiempos Reales
  outDate: z.date(), // Cuándo salió físicamente de tienda
  expectedReturnDate: z.date(), // Cuándo prometió volver
  actualReturnDate: z.date().optional(), // Se llena al recibir la prenda
  cancelDate: z.date().optional(), // Se llena al cancelar la prenda

  // Estado del Alquiler
  status: z.enum([
    "alquilado", // El cliente tiene la ropa
    "devuelto", // Ya regresó (pasó por inspección)
    "reservado_fisico",
    "atrasado", // Ya pasó la fecha de devolución
    "con_daños", // Regresó pero hubo problemas
    "perdido", // El cliente nunca volvió
    "anulado", // El alquiler fue cancelado
  ]),

  // Garantía vinculada
  guaranteeId: z.string().optional(),

  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string().optional(),
  deletedAt: z.date().nullable().default(null),
  deletedBy: z.string().nullable().default(null),
  deleteReason: z.string().nullable().default(""),
  isDeleted: z.boolean().default(false),
});

export type Rental = z.infer<typeof rentalSchema>;

export const rentalWithItemsSchema = rentalSchema.extend({
  items: z.array(rentalItemSchema),
});

// Vista extendida del contrato con obligaciones financieras post-alquiler.
// Los flujos de caja reales siguen en Payment.
export const rentalWithDetailsSchema = rentalWithItemsSchema.extend({
  charges: z.array(rentalChargeSchema),
});

export type RentalWithItems = z.infer<typeof rentalWithItemsSchema>;
export type RentalWithDetails = z.infer<typeof rentalWithDetailsSchema>;

export const rentalWithHistorySchema = rentalSchema.extend({
  statusHistory: z.array(rentalStatusHistorySchema),
});

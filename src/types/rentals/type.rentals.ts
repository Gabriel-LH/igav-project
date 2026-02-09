import z from "zod";
import { rentalItemSchema } from "./type.rentalsItem";

export const rentalSchema = z.object({
  id: z.string(),
  operationId: z.string(),      // Conecta con la transacción financiera
  reservationId: z.string().optional(), // Puede venir de una reserva o ser alquiler directo
  customerId: z.string(),
  branchId: z.string(),
  
  // Control de Tiempos Reales
  outDate: z.date(),            // Cuándo salió físicamente de tienda
  expectedReturnDate: z.date(), // Cuándo prometió volver
  actualReturnDate: z.date().optional(), // Se llena al recibir la prenda
  cancelDate: z.date().optional(), // Se llena al cancelar la prenda
  
  // Estado del Alquiler
  status: z.enum([
    "alquilado",      // El cliente tiene la ropa
    "devuelto",      // Ya regresó (pasó por inspección)
    "reservado_fisico",
    "atrasado",      // Ya pasó la fecha de devolución
    "con_daños",     // Regresó pero hubo problemas
    "perdido",        // El cliente nunca volvió
    "anulado",        // El alquiler fue cancelado
  ]),

  // Garantía vinculada
  guaranteeId: z.string(),
  totalPenalty: z.number().default(0),
  
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string().optional(),
});

export type Rental = z.infer<typeof rentalSchema>;

export const rentalWithItemsSchema = rentalSchema.extend({
  items: z.array(rentalItemSchema),
});

export type RentalWithItems = z.infer<typeof rentalWithItemsSchema>;
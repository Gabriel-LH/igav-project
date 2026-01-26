import z from "zod";
import { reservationItemSchema } from "./type.reservationItem";

export const reservationSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  branchId: z.string(),

  // --- FECHAS DE NEGOCIO (Lo que pactas con el cliente) ---
  startDate: z.date(), // Cuándo se lo lleva
  endDate: z.date(), // Cuándo debería traerlo
  hour: z.string(), // Hora de la cita

  // --- FECHAS DE AUDITORÍA (Control del sistema) ---
  createdAt: z.date(), // Cuándo se creó el registro en el sistema
  updatedAt: z.date(), // Cuándo fue la última vez que se editó (opcional pero recomendado)

  //podemos usar expirada para cuando el cliente no llega por su reserva hasta la fecha limite el sistema lo expire
  status: z.enum(["confirmada", "cancelada", "convertida", "expirada"]),

  //Estos 2 estados nos puede servir para saber en que sera convertida y para algun filtro de mas adelante
  operationType: z.enum(["venta", "alquiler"]),
});

export type Reservation = z.infer<typeof reservationSchema>;

export const reservationWithItemsSchema = reservationSchema.extend({
  items: z.array(reservationItemSchema),
});

export type ReservationWithItems = z.infer<typeof reservationWithItemsSchema>;

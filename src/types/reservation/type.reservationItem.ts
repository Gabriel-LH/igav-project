import z from "zod";

export const reservationItemSchema = z.object({
  id: z.string(),
  operationId: z.number(), // Conecta con la Operación madre
  productId: z.string(),   // El ID del vestido/traje
  reservationId: z.string(), // Conecta con la Reserva madre
  
  // Aquí movimos lo que tenías en "details"
  quantity: z.number().min(1),
  size: z.string(),
  color: z.string(),
  priceAtMoment: z.number(), 
  notes: z.string().optional(),
  
  // Para ropa es vital saber el estado de cada prenda
  itemStatus: z.enum(["en_tienda", "alquilado", "lavandería", "dañado"]),
});

export type ReservationItem = z.infer<typeof reservationItemSchema>;


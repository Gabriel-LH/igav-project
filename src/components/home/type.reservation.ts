import z from "zod";

export const reservationSchema = z.object({
  id: z.string(),
  productId: z.number(), // El ID que conecta con el producto
  customerName: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(["pendiente", "confirmada", "finalizada", "cancelada"]),
  
  // Detalles específicos (Flexibilidad)
  details: z.object({
    size: z.string().optional(),     // Talla (si es ropa)
    quantity: z.number().default(1), // Cantidad
    color: z.string().optional(),    // Color      // Hex del color
    notes: z.string().optional(),    // Notas adicionales
  }),
  
  createdAt: z.date(),
  totalAmount: z.number(), // Precio total acordado para esta reserva
});

export type Reservation = z.infer<typeof reservationSchema>;
import z from "zod";

export const reservationSchema = z.object({
  id: z.string(),
  productId: z.number(),
  customerId: z.string(),
  branchId: z.string().uuid(), // Sucursal donde se retira el producto
  startDate: z.date(),
  endDate: z.date(),
  hour: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  status: z.enum(["pendiente", "confirmada", "finalizada", "cancelada"]),
  details: z.object({
    size: z.string(),
    color: z.string(),
    quantity: z.number().min(1),
    priceAtMoment: z.number(), // Precio pactado al reservar
    notes: z.string().optional(),
  }),
  createdAt: z.date(),
});

export type Reservation = z.infer<typeof reservationSchema>;
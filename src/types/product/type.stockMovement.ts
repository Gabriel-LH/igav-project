import z from "zod";

const stockMovementSchema = z.object({
  id: z.string(),
  stockLotId: z.string(),

  type: z.enum([
    "stock_inicial",        // carga inicial
    "salida_alquiler",             // se alquila
    "retorno_alquiler",          // se devuelve
    "vendido",                 // venta confirmada
    "vendido_pendiente_entrega",         // vendido pendiente entrega
    "reservado",              // reserva
    "liberacion_reserva",      // liberación de reserva
    "mantenimiento_salida",      // sale a mantenimiento
    "mantenimiento_retorno",   // vuelve de mantenimiento
    "ajuste_incremento",  // ajuste manual +
    "ajuste_decremento",  // ajuste manual -
  ]),

  quantity: z.number().positive(),

  operationId: z.string().optional(), // alquiler, venta, etc.
  createdBy: z.string().optional(),
  createdAt: z.date(),
});

export type StockMovement = z.infer<typeof stockMovementSchema>;
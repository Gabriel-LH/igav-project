import z from "zod";
import { saleItemSchema } from "./type.saleItem";

export const saleSchema = z.object({
  id: z.string(),
  operationId: z.string(), // Conecta con la transacción financiera
  customerId: z.string(),
  branchId: z.string(),
  sellerId: z.string(),
  reservationId: z.string().optional(), // Opcional: si viene de una reserva y no tenga duplicados fantasmas
  totalAmount: z.number(),
  saleDate: z.date(),

  // Estados profesionales para flujo de retail:
  // 'pendiente_entrega': Bloquea stock pero no ha salido.
  // 'completado': Dinero recibido y prenda entregada.
  // 'devuelto': Reingreso de prenda después de la venta.
  status: z.enum(["vendido", "cancelado", "pendiente_entrega", "pendiente_pago", "devuelto"]),
  notes: z.string().optional(),
  createdAt: z.date(),

  // Fechas de control logístico
  outDate: z.date().optional(), // Cuándo se le dio físicamente al cliente
  realOutDate: z.date().optional(), // Cuándo se le dio físicamente al cliente
  canceledAt: z.date().optional(),
  returnedAt: z.date().optional(),

  // Información financiera adicional
  amountRefunded: z.number().default(0), // Dinero que se le regresó al cliente

  updatedAt: z.date(), // Crucial para auditoría
  updatedBy: z.string().optional(),
});

export type Sale = z.infer<typeof saleSchema>;

export const saleWithItemsSchema = saleSchema.extend({
  items: z.array(saleItemSchema),
});

export type SaleWithItems = z.infer<typeof saleWithItemsSchema>;

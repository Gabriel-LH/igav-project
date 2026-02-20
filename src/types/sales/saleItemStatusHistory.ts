import z from "zod";

// Reutilizamos los posibles estados de SaleItem.itemStatus
export const saleItemStatusEnum = z.enum([
  "vendido", // Entregado al cliente
  "vendido_pendiente_entrega", // Todavía no se entregó físicamente
  "devuelto", // Devuelto por el cliente
  "dañado", // Devuelto con daño
  "restock", // Listo para volver a stock
  "baja", // Dado de baja, no se puede vender
]);

export const saleItemStatusHistorySchema = z.object({
  id: z.string(),
  saleItemId: z.string(), // Relación con el item vendido

  fromStatus: saleItemStatusEnum,
  toStatus: saleItemStatusEnum,

  reason: z.string().optional(), // Motivo del cambio (ej: "devolución", "reclamo")
  operationId: z.string().optional(), // Vinculado a la transacción o reversión si aplica

  changedBy: z.string().optional(), // Usuario que hizo el cambio
  createdAt: z.date(), // Fecha del cambio
});

export type SaleItemStatusHistory = z.infer<typeof saleItemStatusHistorySchema>;

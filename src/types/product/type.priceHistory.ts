import { z } from "zod";

export const priceHistorySchema = z.object({
  id: z.string(),
  variantId: z.string(),
  tenantId: z.string(),

  // Relaciones opcionales según el origen
  stockLotId: z.string().optional(), // Si el cambio vino por una compra masiva
  inventoryItemId: z.string().optional(), // Si el cambio vino por un ítem serializado específico

  oldPrice: z.number(),
  newPrice: z.number(),

  reason: z.enum([
    "purchase", // Entrada de nueva mercadería (StockLot o Item)
    "adjustment", // Corrección manual del usuario en la tabla
    "import", // Carga masiva por Excel/CSV
    "restock_return", // Devolución de cliente que reingresa al costo original
  ]),

  createdAt: z.date(),
  userId: z.string(),
});
export type PriceHistory = z.infer<typeof priceHistorySchema>;

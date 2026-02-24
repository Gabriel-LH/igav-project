import z from "zod";

export const stockLotSchema = z.object({
  id: z.string(),
  variantCode: z.string(), // SKU extendido por talla/color/sucursal
  productId: z.string(),
  branchId: z.string(),
  sizeId: z.string(), // <--- CAMBIO: Usar ID de la tabla de tallas
  colorId: z.string(), // <--- CAMBIO: Usar ID de la tabla de colores
  quantity: z.number().min(0),
  isForRent: z.boolean(), // Algunos productos no serializados podrían alquilarse por lote
  isForSale: z.boolean(),
  status: z
    .enum(["disponible", "bajo_pedido", "discontinuado"])
    .default("disponible"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StockLot = z.infer<typeof stockLotSchema>;

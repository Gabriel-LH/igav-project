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
  status: z.enum([
    "disponible",
    "en_mantenimiento",
    "alquilado",
    "reservado",
    "vendido_pendiente_entrega",
    "en_lavanderia",
    "baja",
    "agotado",
    "vendido",
  ]),
  isForSale: z.boolean(),
  updatedAt: z.date(),
});

export type StockLot = z.infer<typeof stockLotSchema>;

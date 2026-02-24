import z from "zod";

export const saleItemSchema = z.object({
  id: z.string(),
  saleId: z.string(),
  productId: z.string(),
  stockId: z.string(), // La prenda específica que se llevó
  priceAtMoment: z.number(), // El precio FINAL que pagó el cliente (ej: 80)
  listPrice: z.number().optional(), // El precio ORIGINAL de catálogo (ej: 100)
  quantity: z.number(),

  discountAmount: z.number().default(0), // Dinero descontado (ej: 20)
  discountReason: z.string().optional(), // Ej: "Pack Terno Ejecutivo", "Promo Verano"
  bundleId: z.string().optional(), // ID temporal para agrupar visualmente en el recibo (ej: "pack-uuid-123")
  promotionId: z.string().optional(),

  productName: z.string().optional(),
  variantCode: z.string().optional(), // Para saber qué talla/color era
  serialCode: z.string().optional(), // Para saber qué QR fue (si aplica)
  isSerial: z.boolean().optional(),
  // Importante: no incluir cargos financieros post-venta aquí.
  // Esos montos viven exclusivamente en saleCharge.

  // Campos "Pro" para devoluciones:
  isReturned: z.boolean().default(false),
  returnedAt: z.date().optional(),
  returnCondition: z.enum(["perfecto", "dañado", "manchado"]).optional(),
});

export type SaleItem = z.infer<typeof saleItemSchema>;

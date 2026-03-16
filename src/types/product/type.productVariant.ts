import { z } from "zod";
import { StockLot } from "./type.stockLote";
import { InventoryItem } from "./type.inventoryItem";

export const productVariantSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  productId: z.string(),

  variantCode: z.string(), // SKU único variante
  variantSignature: z.string(), // Identificador único de combinación
  barcode: z.string().optional(),

  // Atributos flexibles (talla, color, RAM, storage, etc)
  attributes: z.record(z.string(), z.string()).default({}),

  // Precios opcionales por variante
  purchasePrice: z.number().min(0).optional().default(0), // Precio de compra
  priceSell: z.number().min(0).optional(), // Precio de venta
  priceRent: z.number().min(0).optional(), // Precio de alquiler
  rentUnit: z.enum(["hora", "día", "semana", "mes", "evento"]).optional(), // Unidad de alquiler

  image: z.array(z.string()).default([]), // Imágenes de la variante

  isActive: z.boolean().default(true), // Estado de la variante

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductVariant = z.infer<typeof productVariantSchema>;

export type VariantWithStock = ProductVariant & {
  stockLots: StockLot[];
};

export type VariantWithInventory = ProductVariant & {
  inventoryItems: InventoryItem[];
};

import { z } from "zod";
import { StockLot } from "./type.stockLote";
import { InventoryItem } from "./type.inventoryItem";

export const productVariantSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  productId: z.string(),

  variantCode: z.string(), // SKU único variante
  barcode: z.string().optional(),

  // Atributos flexibles (talla, color, RAM, storage, etc)
  attributes: z.record(z.string(), z.string()).default({}),

  // Precios opcionales por variante
  purchasePrice: z.number().min(0).optional(),
  priceSell: z.number().min(0).optional(),
  priceRent: z.number().min(0).optional(),
  rentUnit: z.enum(["hora", "día", "semana", "mes", "evento"]).optional(),

  image: z.string().optional(),

  isActive: z.boolean().default(true),

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

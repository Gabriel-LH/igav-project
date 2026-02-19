import z from "zod";
import { StockLot } from "./type.stockLote";
import { InventoryItem } from "./type.inventoryItem";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  modelId: z.string(),
  sku: z.string(), // SKU único por producto base
  categoryId: z.string(),
  description: z.string(),
  is_serial: z.boolean(),
  can_rent: z.boolean(),
  can_sell: z.boolean(),
  price_rent: z.number().min(0).optional(),
  rent_unit: z.enum(["día", "evento"]).optional(),
  price_sell: z.number().min(0).optional(),
});

export type Product = z.infer<typeof productSchema>;

export type ProductWithStock = Product & {
  stockLots: StockLot[]; // Para productos no serializados
  inventoryItems: InventoryItem[]; // Para productos serializados
};

import z from "zod";
import { Stock } from "./type.stock";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  sku: z.string(), // SKU debe ser único
  category: z.string(),
  description: z.string(),
  can_rent: z.boolean(),
  can_sell: z.boolean(),
  price_rent: z.number().min(0).optional(),
  rent_unit: z.enum(["día", "evento"]).optional(),
  price_sell: z.number().min(0).optional(),
});

export type Product = z.infer<typeof productSchema>;


export type ProductWithStock = Product & {
  inventory: Stock[]; // Todos los registros de stock que coincidan con el productId
};
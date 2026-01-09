import z from "zod";

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  image: z.string(),
  sku: z.string(), // SKU debe ser único
  category: z.string(),
  description: z.string(),
  condition: z.enum(["Nuevo", "Usado", "Vintage"]),
  status: z.enum(["disponible", "mantenimiento", "baja"]),
  can_rent: z.boolean(),
  can_sell: z.boolean(),
  price_rent: z.number().min(0).optional(),
  rent_unit: z.enum(["día", "evento"]).optional(),
  price_sell: z.number().min(0).optional(),
  // Totales calculados (vienen de la DB)
  total_stock_global: z.number().default(0), 
  
  // Matriz de stock para el Frontend
  inventory: z.array(z.object({
    size: z.string(),
    color: z.string(),
    colorHex: z.string(),
    // Array de stock por sucursal
    locations: z.array(z.object({
      branchId: z.string(),
      branchName: z.string(), // Para no tener que buscarlo en otra tabla
      quantity: z.number().min(0),
    }))
  })),
});

export type Product = z.infer<typeof productSchema>;
import z from "zod";

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  image: z.string(),
  sku: z.string(),
  category: z.string(),
  description: z.string(),
  condition: z.string(), // "Nuevo", "Usado", "Vintage"
  status: z.enum(["disponible", "mantenimiento", "baja"]),
  total_stock: z.number(),
  can_rent: z.boolean(),
  can_sell: z.boolean(),
  price_rent: z.number().optional(),
  rent_unit: z.string().optional(), // "día", "evento"
  price_sell: z.number().optional(),
  // Opciones disponibles para este modelo

  sizes: z.array(z.string()), 
  colors: z.array(z.object({
    name: z.string(),
    hex: z.string()
  })),

  // La "Matriz" de stock real
  inventory: z.array(z.object({
    size: z.string(),
    color: z.string(), // nombre del color
    stock: z.number(),
    other_branch_stock: z.number()
  })),


});
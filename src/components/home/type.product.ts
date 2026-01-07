import z from "zod";

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  image: z.string(),
  status: z.enum(["disponible", "mantenimiento", "baja"]), // Mejor un enum que string
  category: z.string(),
  description: z.string(),
  in_stock: z.number(),
  condition: z.string(),
  can_rent: z.boolean(),
  can_sell: z.boolean(),
  is_reserved: z.boolean(), // Estado actual
  price_rent: z.number(),
  rent_unit: z.string(),
  price_sell: z.number(),
});

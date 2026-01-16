import z from "zod";
import { Product } from "./type.product";

export const stockSchema = z.object({
    id: z.string(),
    productId: z.string(),
    size: z.string(),
    color: z.string(),
    colorHex: z.string(),
    branchId: z.string(),   // La sucursal donde está
    quantity: z.number().min(0),

    // Estos campos están bien aquí porque definen el estado de la prenda física
    condition: z.enum(["Nuevo", "Usado", "Vintage"]),
    status: z.enum(["disponible", "mantenimiento", "alquilado", "lavanderia", "baja", "agotado", "vendido"]), 
    damageNotes: z.string().optional(),
    updatedAt: z.date(),
   
  })

  export type Stock = z.infer<typeof stockSchema>;


  export type ProductWithStock = Product & {
  inventory: Stock[]; 
};
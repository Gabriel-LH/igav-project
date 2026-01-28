import z from "zod";
import { Product } from "./type.product";

export const stockSchema = z.object({
  id: z.string(),
  productId: z.string(),
  size: z.string(),
  color: z.string(),
  colorHex: z.string(),
  branchId: z.string(), // La sucursal donde está
  quantity: z.number().min(0),

  // CONTROL DE OPERACIÓN (Sobrescribe al producto si es necesario)
  isForRent: true, // ¿Esta unidad específica se puede alquilar?
  isForSale: false, // Quizás este ya está muy usado y solo lo dejamos para alquiler

  // HISTORIAL INDIVIDUAL (Solo posible si el ítem es único)
  usageCount: 15, // Cuántas veces se ha alquilado
  lastMaintenance: "2026-01-10",

  // Estos campos están bien aquí porque definen el estado de la prenda física
  condition: z.enum(["Nuevo", "Usado", "Vintage"]),
  status: z.enum([
    "disponible",
    "en_mantenimiento",
    "alquilado",
    "en_lavanderia",
    "baja",
    "agotado",
    "vendido",
  ]),
  damageNotes: z.string().optional(),
  updatedAt: z.date(),
});

export type Stock = z.infer<typeof stockSchema>;

export type ProductWithStock = Product & {
  inventory: Stock[];
};

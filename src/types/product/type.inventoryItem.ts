import z from "zod";

export const inventoryItemSchema = z.object({
  id: z.string(),
  serialCode: z.string(),        // Código único físico (para QR)
  variantCode: z.string(),       // Relación a variante de producto
  productId: z.string(),
  branchId: z.string(),
  size: z.string(),
  color: z.string(),
  colorHex: z.string(),
  isForRent: z.boolean(),
  isForSale: z.boolean(),
  usageCount: z.number().min(0),
  lastMaintenance: z.string().optional(),
  condition: z.enum(["Nuevo", "Usado", "Vintage"]),
  status: z.enum([
    "disponible",
    "en_mantenimiento",
    "alquilado",
    "reservado",
    "vendido_pendiente_entrega",
    "en_lavanderia",
    "baja",
    "agotado",
    "vendido",
  ]),
  damageNotes: z.string().optional(),
  updatedAt: z.date(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

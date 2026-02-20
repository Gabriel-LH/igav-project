import z from "zod";
import { inventoryItemStatusHistorySchema } from "./type.inventoryItemStatusHistory";

export const inventoryItemSchema = z.object({
  id: z.string(),
  serialCode: z.string(), // Código único físico (para QR)
  variantCode: z.string(), // Relación a variante de producto
  productId: z.string(),
  branchId: z.string(),
  sizeId: z.string(), // <--- CAMBIO: Usar ID de la tabla de tallas
  colorId: z.string(), // <--- CAMBIO: Usar ID de la tabla de colores
  isForRent: z.boolean(),
  isForSale: z.boolean(),
  usageCount: z.number().min(0),
  lastMaintenance: z.date().optional(),
  condition: z.enum(["Nuevo", "Usado", "Vintage"]),
  status: z.enum([
    "disponible",
    "en_mantenimiento",
    "alquilado",
    "reservado",
    "vendido_pendiente_entrega",
    "en_lavanderia",
    "retirado",
    "vendido",
  ]),
  damageNotes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const inventoryItemWithHistorySchema =
  inventoryItemSchema.extend({
    statusHistory: z.array(inventoryItemStatusHistorySchema),
  });

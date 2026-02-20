import z from "zod";

export const inventoryItemStatusHistorySchema = z.object({
  id: z.string(),
  inventoryItemId: z.string(),

  fromStatus: z.enum([
    "disponible",
    "en_mantenimiento",
    "alquilado",
    "reservado",
    "vendido_pendiente_entrega",
    "en_lavanderia",
    "retirado",
    "vendido",
  ]),
  toStatus: z.enum([
    "disponible",
    "en_mantenimiento",
    "alquilado",
    "reservado",
    "vendido_pendiente_entrega",
    "en_lavanderia",
    "retirado",
    "vendido",
  ]),

  reason: z.string().optional(),
  operationId: z.string().optional(),

  changedBy: z.string().optional(),
  createdAt: z.date(),
});

export type InventoryItemStatusHistory = z.infer<
  typeof inventoryItemStatusHistorySchema
>;

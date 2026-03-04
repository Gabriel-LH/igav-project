import { z } from "zod";

//Para historial de movimiento de inventario
export const inventoryMovementSchema = z.object({
  id: z.string(),

  tenantId: z.string(),

  branchId: z.string(),
  productId: z.string(),

  variantId: z.string().optional(),

  type: z.enum([
    "sale",
    "purchase",
    "transfer_out",
    "transfer_in",
    "adjustment",
    "initial_stock",
    "return",
    "rental_out",
    "rental_return",
  ]),

  referenceType: z.enum([
    "sale",
    "purchase",
    "transfer",
    "adjustment",
    "rental",
  ]),

  referenceId: z.string(),

  quantity: z.number(), // + entra, - sale

  unitCost: z.number().optional(), // importante para valorización

  createdBy: z.string(),
  createdAt: z.date(),
});

export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;

import { z } from "zod";

export const promotionSchema = z.object({
  id: z.string(),
  name: z.string(), // Ej: "Campaña Día del Padre", "Liquidación Verano"
  code: z.string().optional(), // Ej: "PADRE2026" (si quieres usar cupones)

  // ¿De qué tipo es el descuento?
  type: z.enum(["percentage", "fixed_amount"]),
  value: z.number().min(0), // Ej: 10 (para 10%) o 50 (para S/ 50.00)

  // ¿A quién aplica? (Scope)
  scope: z.enum(["global", "category", "product_specific", "pack"]),

  // IDs a los que aplica (Si es category -> IDs de categorías, Si es product -> IDs de productos)
  targetIds: z.array(z.string()).optional(),

  // Vigencia
  startDate: z.date(),
  endDate: z.date().optional(), // Si es null, es indefinido

  // Restricciones
  isActive: z.boolean().default(true),
  branchIds: z.array(z.string()).optional(), // ¿Aplica solo en algunas tiendas?
  minPurchaseAmount: z.number().optional(), // "Descuento válido por compras mayores a S/ 200"

  maxUses: z.number().int().optional(),
  usedCount: z.number().int().default(0),
  combinable: z.boolean().default(true),

  createdAt: z.date(),
  createdBy: z.string().optional(),
  updatedAt: z.date().optional(),
  updatedBy: z.string().optional(),
});

export type Promotion = z.infer<typeof promotionSchema>;

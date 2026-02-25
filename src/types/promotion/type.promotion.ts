import { z } from "zod";

export const promotionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["percentage", "fixed_amount", "bundle"]),
  scope: z.enum(["global", "category", "product_specific", "pack"]),
  value: z.number().min(0).optional(),
  appliesTo: z.array(z.enum(["venta", "alquiler"])),
  bundleConfig: z
    .object({
      requiredProductIds: z.array(z.string()),
      bundlePrice: z.number().min(0),
      prorateStrategy: z.enum(["proportional", "equal"]),
    })
    .optional(),
  isExclusive: z.boolean().default(true),
  // Compatibilidad con implementación previa
  code: z.string().optional(),
  targetIds: z.array(z.string()).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),
  branchIds: z.array(z.string()).optional(),
  minPurchaseAmount: z.number().optional(),
  maxUses: z.number().int().optional(),
  usedCount: z.number().int().default(0),
  combinable: z.boolean().default(true),
  createdAt: z.date(),
  createdBy: z.string().optional(),
  updatedAt: z.date().optional(),
  updatedBy: z.string().optional(),
});

export type Promotion = z.infer<typeof promotionSchema>;

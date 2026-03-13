import { z } from "zod";

export const stockLotSchema = z.object({
  id: z.string(),

  tenantId: z.string(),
  productId: z.string(),
  variantId: z.string(),

  branchId: z.string(),

  quantity: z.number().min(0),
  barcode: z.string().optional(),

  expirationDate: z.date().optional(),

  lotNumber: z.string().optional(),
  condition: z.enum(["Nuevo", "Usado", "Vintage"]).optional(),

  isForRent: z.boolean(),
  isForSale: z.boolean(),

  status: z
    .enum([
      "en_transito",
      "disponible",
      "bajo_pedido",
      "discontinuado",
      "alquilado",
      "vendido",
    ])
    .default("en_transito"),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StockLot = z.infer<typeof stockLotSchema>;

// Para el formulario (omitimos campos auto-generados)
export type StockLotFormData = Omit<
  StockLot,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

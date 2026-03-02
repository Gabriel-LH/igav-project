import z from "zod";

export const productSchema = z.object({
  id: z.string(),
  tenantId: z.string(),

  name: z.string(),
  image: z.string(),
  baseSku: z.string(), // SKU único por producto base
  modelId: z.string(),
  categoryId: z.string(),
  description: z.string(),

  is_serial: z.boolean(),
  can_rent: z.boolean(),
  can_sell: z.boolean(),

  createdAt: z.date(),
  createdBy: z.string(),
  updatedAt: z.date(),
  updatedBy: z.string().optional(),

  deletedAt: z.date().nullable().default(null),
  deletedBy: z.string().nullable().default(null),
  deleteReason: z.string().nullable().default(null),
  isDeleted: z.boolean().default(false),
});

export type Product = z.infer<typeof productSchema>;

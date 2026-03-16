import z from "zod";

export const productSchema = z.object({
  id: z.string(),
  tenantId: z.string(),

  name: z.string(),
  image: z.array(z.string()).default([]),
  baseSku: z.string(), // SKU único por producto base
  modelId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional(),

  is_serial: z.boolean(),
  can_rent: z.boolean(),
  can_sell: z.boolean(),

  createdAt: z.date(),
  createdBy: z.string().optional(),
  updatedAt: z.date(),
  updatedBy: z.string().optional(),

  deletedAt: z.date().nullable().default(null),
  deletedBy: z.string().nullable().default(null),
  deleteReason: z.string().nullable().default(null),
  isDeleted: z.boolean().default(false),
});

export type Product = z.infer<typeof productSchema>;

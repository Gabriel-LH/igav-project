import z from "zod";

export const modelSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  brandId: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  description: z.string().nullable().optional(),
  year: z.number().nullable().optional(), // Año del modelo (útil para autos, tech, etc.)
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Model = z.infer<typeof modelSchema>;
export type ModelFormData = Omit<
  Model,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

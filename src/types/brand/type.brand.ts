// types/brand.ts
import { z } from "zod";

export const brandSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, "Nombre requerido"),
  slug: z.string().min(1, "Slug requerido").nullable(),
  description: z.string().nullable().optional(), // Campo extra útil
  logo: z.string().nullable().optional(), // URL del logo
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Brand = z.infer<typeof brandSchema>;
export type BrandFormData = Omit<Brand, "id" | "tenantId" | "createdAt" | "updatedAt">;
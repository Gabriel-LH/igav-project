// types/brand.ts
import { z } from "zod";

export const brandSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, "Nombre requerido"),
  slug: z.string().min(1, "Slug requerido"),
  description: z.string().optional(), // Campo extra útil
  logo: z.string().optional(), // URL del logo
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Brand = z.infer<typeof brandSchema>;
export type BrandFormData = Omit<Brand, "id" | "tenantId" | "createdAt" | "updatedAt">;
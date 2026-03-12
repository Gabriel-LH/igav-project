import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(), // Ej: "Ternos"
  description: z.string().nullable().optional(),
  tenantId: z.string(),

  // 🔥 EL SUPERPODER: Subcategorías
  // Si es null/undefined, es una categoría principal.
  // Si tiene un ID, es subcategoría de ese ID.
  parentId: z.string().nullable().optional(),
  level: z.number().nullable().default(0).optional(),
  path: z.string().nullable().optional(),

  image: z.string().nullable().optional(), // Para botones en el POS
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),

  order: z.number().nullable().default(0).optional(),

  //Comportamiento
  isActive: z.boolean().default(true),
  showInPos: z.boolean().nullable().default(true).optional(),
  showInEcommerce: z.boolean().nullable().default(true).optional(),

  productCount: z.number().nullable().default(0).optional(), // Contador de productos directos
  totalProductCount: z.number().nullable().default(0).optional(), // Productos incluyendo subcategorías

  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryFormData = Omit<
  Category,
  | "id"
  | "tenantId"
  | "level"
  | "path"
  | "createdAt"
  | "updatedAt"
  | "createdBy"
  | "updatedBy"
  | "productCount"
  | "totalProductCount"
>;

// Helper para construir árbol
export interface CategoryNode extends Category {
  children: CategoryNode[];
  fullPath: string; // Nombre completo: "Electrónica > Electrodomésticos > Refrigeradoras"
}

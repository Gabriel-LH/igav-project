import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(), // Ej: "Ternos"
  description: z.string().optional(),
  tenantId: z.string(),

  // 🔥 EL SUPERPODER: Subcategorías
  // Si es null/undefined, es una categoría principal.
  // Si tiene un ID, es subcategoría de ese ID.
  parentId: z.string().optional(),
  level: z.number().default(0).optional(),
  path: z.string().optional(),

  image: z.string().optional(), // Para botones en el POS
  color: z.string().optional(),
  icon: z.string().optional(),
  slug: z.string().optional(),

  order: z.number().default(0).optional(),

  //Comportamiento
  isActive: z.boolean().default(true),
  showInPos: z.boolean().default(true).optional(),
  showInEcommerce: z.boolean().default(true).optional(),

  productCount: z.number().default(0).optional(), // Contador de productos directos
  totalProductCount: z.number().default(0).optional(), // Productos incluyendo subcategorías

  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
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

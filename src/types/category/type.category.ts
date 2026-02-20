import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(), // Ej: "Ternos"
  description: z.string().optional(),

  // 🔥 EL SUPERPODER: Subcategorías
  // Si es null/undefined, es una categoría principal.
  // Si tiene un ID, es subcategoría de ese ID.
  parentId: z.string().optional(),
  image: z.string().optional(), // Para botones en el POS
  slug: z.string().optional(),

  isActive: z.boolean().default(true),

  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;

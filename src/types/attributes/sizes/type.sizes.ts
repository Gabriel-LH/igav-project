// src/types/attributes/type.size.ts
import { z } from "zod";

export const sizeSchema = z.object({
  id: z.string(),
  name: z.string(),       // Ej: "M" o "48"
  type: z.enum(["alfabetica", "numerica", "calzado", "otro"]), // Para agruparlas
  description: z.string().optional(), // Ej: "Talla europea"
  isActive: z.boolean().default(true),
});

export type Size = z.infer<typeof sizeSchema>;
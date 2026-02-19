// src/types/attributes/type.color.ts
import { z } from "zod";

export const colorSchema = z.object({
  id: z.string(),
  name: z.string(),       // Ej: "Azul Marino"
  code: z.string(),       // Ej: "AZ-MAR" (Útil para generar SKUs)
  hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color hex inválido"), // Ej: "#000080"
  isActive: z.boolean().default(true),
});

export type Color = z.infer<typeof colorSchema>;
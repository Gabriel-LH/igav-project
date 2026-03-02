import { z } from "zod";

export const attributeTypeSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, "Nombre requerido"),
  code: z.string().min(1, "Código requerido"),
  inputType: z.enum(["text", "number", "select", "boolean", "color", "date"]),
  isVariant: z.boolean(),
  affectsSku: z.boolean(),
  isActive: z.boolean(),
});

export type AttributeType = z.infer<typeof attributeTypeSchema>;

export type AttributeTypeFormData = Omit<AttributeType, "id" | "tenantId">;

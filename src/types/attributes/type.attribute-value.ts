import { z } from "zod";

export const attributeValueSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  code: z.string(),
  value: z.string(),
  attributeTypeId: z.string(),
  hexColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Hex inválido")
    .optional(),
  isActive: z.boolean(),
});

export type AttributeValue = z.infer<typeof attributeValueSchema>;
export type AttributeValueFormData = Omit<AttributeValue, "id" | "tenantId">;

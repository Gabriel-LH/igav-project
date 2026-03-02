import { z } from "zod";

export const attributeValueSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  code: z.string(),
  value: z.string(),
  attributeTypeId: z.string(),
  isActive: z.boolean(),
});

export type AttributeValue = z.infer<typeof attributeValueSchema>;
export type AttributeValueFormData = Omit<AttributeValue, "id" | "tenantId">;

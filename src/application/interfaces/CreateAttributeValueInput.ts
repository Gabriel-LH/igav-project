import { AttributeValue } from "../../types/attributes/type.attribute-value";

export interface CreateAttributeValueInput
  extends Omit<AttributeValue, "id" | "tenantId"> {
  tenantId: string;
}

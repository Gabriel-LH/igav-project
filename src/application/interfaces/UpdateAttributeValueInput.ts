import { AttributeValue } from "../../types/attributes/type.attribute-value";

export interface UpdateAttributeValueInput extends Partial<AttributeValue> {
  tenantId: string;
  attributeValueId: string;
}

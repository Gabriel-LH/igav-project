import { AttributeType } from "../../types/attributes/type.attribute-type";

export interface UpdateAttributeTypeInput extends Partial<AttributeType> {
  tenantId: string;
  attributeTypeId: string;
}

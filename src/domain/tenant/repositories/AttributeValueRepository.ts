import { AttributeValue } from "../../../types/attributes/type.attribute-value";

export interface AttributeValueRepository {
  addAttributeValue(attributeValue: AttributeValue): void;
  updateAttributeValue(
    attributeValueId: string,
    updates: Partial<AttributeValue>,
  ): void;
  getAttributeValueById(
    tenantId: string,
    attributeValueId: string,
  ): AttributeValue | undefined;
  getAttributeValuesByTenant(tenantId: string): AttributeValue[];
  getAttributeValuesByType(
    tenantId: string,
    attributeTypeId: string,
  ): AttributeValue[];
  markAsActive(attributeValueId: string): void;
  markAsInactive(attributeValueId: string): void;
  removeAttributeValue(attributeValueId: string): void;
}

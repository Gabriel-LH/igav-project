import { AttributeValue } from "../../../types/attributes/type.attribute-value";

export interface AttributeValueRepository {
  addAttributeValue(attributeValue: AttributeValue): Promise<void>;
  updateAttributeValue(
    attributeValueId: string,
    updates: Partial<AttributeValue>,
  ): Promise<void>;
  getAttributeValueById(
    tenantId: string,
    attributeValueId: string,
  ): Promise<AttributeValue | undefined>;
  getAttributeValuesByTenant(tenantId: string): Promise<AttributeValue[]>;
  getAttributeValuesByType(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<AttributeValue[]>;
  markAsActive(attributeValueId: string): Promise<void>;
  markAsInactive(attributeValueId: string): Promise<void>;
  removeAttributeValue(attributeValueId: string): Promise<void>;
}

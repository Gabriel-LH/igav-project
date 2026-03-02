import { AttributeType } from "../../types/attributes/type.attribute-type";

export interface AttributeTypeRepository {
  addAttributeType(attributeType: AttributeType): void;
  updateAttributeType(
    attributeTypeId: string,
    updates: Partial<AttributeType>,
  ): void;
  getAttributeTypeById(
    tenantId: string,
    attributeTypeId: string,
  ): AttributeType | undefined;
  getAttributeTypesByTenant(tenantId: string): AttributeType[];
  markAsActive(attributeTypeId: string): void;
  markAsInactive(attributeTypeId: string): void;
  removeAttributeType(attributeTypeId: string): void;
}

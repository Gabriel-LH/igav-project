import { AttributeType } from "../../../types/attributes/type.attribute-type";

export interface AttributeTypeRepository {
  addAttributeType(attributeType: AttributeType): void;
  updateAttributeType(
    tenantId: string,
    attributeTypeId: string,
    updates: Partial<AttributeType>,
  ): void;
  getAttributeTypeById(
    tenantId: string,
    attributeTypeId: string,
  ): AttributeType | undefined;
  getAttributeTypesByTenant(tenantId: string): AttributeType[];
  markAsActive(tenantId: string, attributeTypeId: string): void;
  markAsInactive(tenantId: string, attributeTypeId: string): void;
  removeAttributeType(tenantId: string, attributeTypeId: string): void;
}

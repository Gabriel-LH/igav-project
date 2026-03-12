import { AttributeType } from "../../../types/attributes/type.attribute-type";

export interface AttributeTypeRepository {
  addAttributeType(attributeType: AttributeType): Promise<void>;
  updateAttributeType(
    tenantId: string,
    attributeTypeId: string,
    updates: Partial<AttributeType>,
  ): Promise<void>;
  getAttributeTypeById(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<AttributeType | undefined>;
  getAttributeTypesByTenant(tenantId: string): Promise<AttributeType[]>;
  markAsActive(tenantId: string, attributeTypeId: string): Promise<void>;
  markAsInactive(tenantId: string, attributeTypeId: string): Promise<void>;
  removeAttributeType(tenantId: string, attributeTypeId: string): Promise<void>;
}

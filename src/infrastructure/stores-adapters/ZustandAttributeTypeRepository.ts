import { AttributeTypeRepository } from "../../domain/repositories/AttributeTypeRepository";
import { useAttributeTypeStore } from "../../store/useAttributeTypeStore";
import { AttributeType } from "../../types/attributes/type.attribute-type";

export class ZustandAttributeTypeRepository implements AttributeTypeRepository {
  addAttributeType(attributeType: AttributeType): void {
    useAttributeTypeStore.getState().addAttributeType(attributeType);
  }

  updateAttributeType(
    attributeTypeId: string,
    updates: Partial<AttributeType>,
  ): void {
    useAttributeTypeStore.getState().updateAttributeType(attributeTypeId, updates);
  }

  getAttributeTypeById(
    tenantId: string,
    attributeTypeId: string,
  ): AttributeType | undefined {
    return useAttributeTypeStore
      .getState()
      .getAttributeTypeById(tenantId, attributeTypeId);
  }

  getAttributeTypesByTenant(tenantId: string): AttributeType[] {
    return useAttributeTypeStore.getState().getAttributeTypesByTenant(tenantId);
  }

  markAsActive(attributeTypeId: string): void {
    useAttributeTypeStore.getState().markAsActive(attributeTypeId);
  }

  markAsInactive(attributeTypeId: string): void {
    useAttributeTypeStore.getState().markAsInactive(attributeTypeId);
  }

  removeAttributeType(attributeTypeId: string): void {
    useAttributeTypeStore.getState().removeAttributeType(attributeTypeId);
  }
}

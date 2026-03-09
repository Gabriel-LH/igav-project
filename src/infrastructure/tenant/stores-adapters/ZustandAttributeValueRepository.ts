import { AttributeValueRepository } from "../../../domain/tenant/repositories/AttributeValueRepository";
import { useAttributeValueStore } from "../../../store/useAttributeValueStore";
import { AttributeValue } from "../../../types/attributes/type.attribute-value";

export class ZustandAttributeValueRepository implements AttributeValueRepository {
  addAttributeValue(attributeValue: AttributeValue): void {
    useAttributeValueStore.getState().addAttributeValue(attributeValue);
  }

  updateAttributeValue(
    attributeValueId: string,
    updates: Partial<AttributeValue>,
  ): void {
    useAttributeValueStore
      .getState()
      .updateAttributeValue(attributeValueId, updates);
  }

  getAttributeValueById(
    tenantId: string,
    attributeValueId: string,
  ): AttributeValue | undefined {
    return useAttributeValueStore
      .getState()
      .getAttributeValueById(tenantId, attributeValueId);
  }

  getAttributeValuesByTenant(tenantId: string): AttributeValue[] {
    return useAttributeValueStore
      .getState()
      .getAttributeValuesByTenant(tenantId);
  }

  getAttributeValuesByType(
    tenantId: string,
    attributeTypeId: string,
  ): AttributeValue[] {
    return useAttributeValueStore
      .getState()
      .getAttributeValuesByType(tenantId, attributeTypeId);
  }

  markAsActive(attributeValueId: string): void {
    useAttributeValueStore.getState().markAsActive(attributeValueId);
  }

  markAsInactive(attributeValueId: string): void {
    useAttributeValueStore.getState().markAsInactive(attributeValueId);
  }

  removeAttributeValue(attributeValueId: string): void {
    useAttributeValueStore.getState().removeAttributeValue(attributeValueId);
  }
}

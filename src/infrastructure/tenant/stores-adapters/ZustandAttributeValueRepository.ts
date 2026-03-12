import { AttributeValueRepository } from "../../../domain/tenant/repositories/AttributeValueRepository";
import { useAttributeValueStore } from "../../../store/useAttributeValueStore";
import { AttributeValue } from "../../../types/attributes/type.attribute-value";

export class ZustandAttributeValueRepository implements AttributeValueRepository {
  async addAttributeValue(attributeValue: AttributeValue): Promise<void> {
    useAttributeValueStore.getState().addAttributeValue(attributeValue);
  }

  async updateAttributeValue(
    attributeValueId: string,
    updates: Partial<AttributeValue>,
  ): Promise<void> {
    useAttributeValueStore
      .getState()
      .updateAttributeValue(attributeValueId, updates);
  }

  async getAttributeValueById(
    tenantId: string,
    attributeValueId: string,
  ): Promise<AttributeValue | undefined> {
    return useAttributeValueStore
      .getState()
      .getAttributeValueById(tenantId, attributeValueId);
  }

  async getAttributeValuesByTenant(
    tenantId: string,
  ): Promise<AttributeValue[]> {
    return useAttributeValueStore
      .getState()
      .getAttributeValuesByTenant(tenantId);
  }

  async getAttributeValuesByType(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<AttributeValue[]> {
    return useAttributeValueStore
      .getState()
      .getAttributeValuesByType(tenantId, attributeTypeId);
  }

  async markAsActive(attributeValueId: string): Promise<void> {
    useAttributeValueStore.getState().markAsActive(attributeValueId);
  }

  async markAsInactive(attributeValueId: string): Promise<void> {
    useAttributeValueStore.getState().markAsInactive(attributeValueId);
  }

  async removeAttributeValue(attributeValueId: string): Promise<void> {
    useAttributeValueStore.getState().removeAttributeValue(attributeValueId);
  }
}

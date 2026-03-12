import { AttributeTypeRepository } from "../../../domain/tenant/repositories/AttributeTypeRepository";
import { useAttributeTypeStore } from "../../../store/useAttributeTypeStore";
import { AttributeType } from "../../../types/attributes/type.attribute-type";

export class ZustandAttributeTypeRepository implements AttributeTypeRepository {
  async addAttributeType(attributeType: AttributeType): Promise<void> {
    useAttributeTypeStore.getState().addAttributeType(attributeType);
  }

  async updateAttributeType(
    tenantId: string,
    attributeTypeId: string,
    updates: Partial<AttributeType>,
  ): Promise<void> {
    void tenantId;
    useAttributeTypeStore
      .getState()
      .updateAttributeType(attributeTypeId, updates);
  }

  async getAttributeTypeById(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<AttributeType | undefined> {
    return useAttributeTypeStore
      .getState()
      .getAttributeTypeById(tenantId, attributeTypeId);
  }

  async getAttributeTypesByTenant(
    tenantId: string,
  ): Promise<AttributeType[]> {
    return useAttributeTypeStore.getState().getAttributeTypesByTenant(tenantId);
  }

  async markAsActive(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<void> {
    void tenantId;
    useAttributeTypeStore.getState().markAsActive(attributeTypeId);
  }

  async markAsInactive(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<void> {
    void tenantId;
    useAttributeTypeStore.getState().markAsInactive(attributeTypeId);
  }

  async removeAttributeType(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<void> {
    void tenantId;
    useAttributeTypeStore.getState().removeAttributeType(attributeTypeId);
  }
}

import { create } from "zustand";
import { ATTRIBUTE_TYPES_MOCK } from "../mocks/mock.attributeType";
import { AttributeType } from "../types/attributes/type.attribute-type";

interface AttributeTypeState {
  attributeTypes: AttributeType[];
  addAttributeType: (attributeType: AttributeType) => void;
  updateAttributeType: (
    attributeTypeId: string,
    updates: Partial<AttributeType>,
  ) => void;
  getAttributeTypeById: (
    tenantId: string,
    attributeTypeId: string,
  ) => AttributeType | undefined;
  getAttributeTypesByTenant: (tenantId: string) => AttributeType[];
  markAsActive: (attributeTypeId: string) => void;
  markAsInactive: (attributeTypeId: string) => void;
  removeAttributeType: (attributeTypeId: string) => void;
}

export const useAttributeTypeStore = create<AttributeTypeState>((set, get) => ({
  attributeTypes: ATTRIBUTE_TYPES_MOCK,

  addAttributeType: (attributeType) =>
    set((state) => ({
      attributeTypes: [...state.attributeTypes, attributeType],
    })),

  updateAttributeType: (attributeTypeId, updates) =>
    set((state) => ({
      attributeTypes: state.attributeTypes.map((attributeType) =>
        attributeType.id === attributeTypeId
          ? { ...attributeType, ...updates }
          : attributeType,
      ),
    })),

  getAttributeTypeById: (tenantId, attributeTypeId) =>
    get().attributeTypes.find(
      (attributeType) =>
        attributeType.tenantId === tenantId && attributeType.id === attributeTypeId,
    ),

  getAttributeTypesByTenant: (tenantId) =>
    get().attributeTypes.filter((attributeType) => attributeType.tenantId === tenantId),

  markAsActive: (attributeTypeId) =>
    set((state) => ({
      attributeTypes: state.attributeTypes.map((attributeType) =>
        attributeType.id === attributeTypeId
          ? { ...attributeType, isActive: true }
          : attributeType,
      ),
    })),

  markAsInactive: (attributeTypeId) =>
    set((state) => ({
      attributeTypes: state.attributeTypes.map((attributeType) =>
        attributeType.id === attributeTypeId
          ? { ...attributeType, isActive: false }
          : attributeType,
      ),
    })),

  removeAttributeType: (attributeTypeId) =>
    set((state) => ({
      attributeTypes: state.attributeTypes.filter(
        (attributeType) => attributeType.id !== attributeTypeId,
      ),
    })),
}));

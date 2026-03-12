import { create } from "zustand";
import { ATTRIBUTE_VALUES_MOCK } from "../mocks/mock.attributeValue";
import { AttributeValue } from "../types/attributes/type.attribute-value";

interface AttributeValueState {
  attributeValues: AttributeValue[];
  setAttributeValues: (attributeValues: AttributeValue[]) => void;
  addAttributeValue: (attributeValue: AttributeValue) => void;
  updateAttributeValue: (
    attributeValueId: string,
    updates: Partial<AttributeValue>,
  ) => void;
  getAttributeValueById: (
    tenantId: string,
    attributeValueId: string,
  ) => AttributeValue | undefined;
  getAttributeValuesByTenant: (tenantId: string) => AttributeValue[];
  getAttributeValuesByType: (
    tenantId: string,
    attributeTypeId: string,
  ) => AttributeValue[];
  markAsActive: (attributeValueId: string) => void;
  markAsInactive: (attributeValueId: string) => void;
  removeAttributeValue: (attributeValueId: string) => void;
}

export const useAttributeValueStore = create<AttributeValueState>((set, get) => ({
  attributeValues: ATTRIBUTE_VALUES_MOCK,
  setAttributeValues: (attributeValues) => set({ attributeValues }),

  addAttributeValue: (attributeValue) =>
    set((state) => ({
      attributeValues: [...state.attributeValues, attributeValue],
    })),

  updateAttributeValue: (attributeValueId, updates) =>
    set((state) => ({
      attributeValues: state.attributeValues.map((attributeValue) =>
        attributeValue.id === attributeValueId
          ? { ...attributeValue, ...updates }
          : attributeValue,
      ),
    })),

  getAttributeValueById: (tenantId, attributeValueId) =>
    get().attributeValues.find(
      (attributeValue) =>
        attributeValue.tenantId === tenantId &&
        attributeValue.id === attributeValueId,
    ),

  getAttributeValuesByTenant: (tenantId) =>
    get().attributeValues.filter(
      (attributeValue) => attributeValue.tenantId === tenantId,
    ),

  getAttributeValuesByType: (tenantId, attributeTypeId) =>
    get().attributeValues.filter(
      (attributeValue) =>
        attributeValue.tenantId === tenantId &&
        attributeValue.attributeTypeId === attributeTypeId,
    ),

  markAsActive: (attributeValueId) =>
    set((state) => ({
      attributeValues: state.attributeValues.map((attributeValue) =>
        attributeValue.id === attributeValueId
          ? { ...attributeValue, isActive: true }
          : attributeValue,
      ),
    })),

  markAsInactive: (attributeValueId) =>
    set((state) => ({
      attributeValues: state.attributeValues.map((attributeValue) =>
        attributeValue.id === attributeValueId
          ? { ...attributeValue, isActive: false }
          : attributeValue,
      ),
    })),

  removeAttributeValue: (attributeValueId) =>
    set((state) => ({
      attributeValues: state.attributeValues.filter(
        (attributeValue) => attributeValue.id !== attributeValueId,
      ),
    })),
}));

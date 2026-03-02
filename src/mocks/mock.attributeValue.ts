// mocks/attributeValues.ts
import { AttributeValue } from "../types/attributes/type.attribute-value"; 

export const ATTRIBUTE_VALUES_MOCK: AttributeValue[] = [
  {
    id: "attr-val-1",
    tenantId: "tenant-a",
    code: "NEGRO",
    value: "Negro",
    attributeTypeId: "attr-type-1", // Color
    hexColor: "#000000",
    isActive: true,
  },
  {
    id: "attr-val-2",
    tenantId: "tenant-a",
    code: "AZUL",
    value: "Azul",
    attributeTypeId: "attr-type-1", // Color
    hexColor: "#2563eb",
    isActive: true,
  },
  {
    id: "attr-val-3",
    tenantId: "tenant-a",
    code: "ROJO",
    value: "Rojo",
    attributeTypeId: "attr-type-1", // Color
    hexColor: "#dc2626",
    isActive: true,
  },
  {
    id: "attr-val-4",
    tenantId: "tenant-a",
    code: "S",
    value: "Small",
    attributeTypeId: "attr-type-2", // Talla
    isActive: true,
  },
  {
    id: "attr-val-5",
    tenantId: "tenant-a",
    code: "M",
    value: "Medium",
    attributeTypeId: "attr-type-2", // Talla
    isActive: true,
  },
  {
    id: "attr-val-6",
    tenantId: "tenant-a",
    code: "L",
    value: "Large",
    attributeTypeId: "attr-type-2", // Talla
    isActive: true,
  },
];

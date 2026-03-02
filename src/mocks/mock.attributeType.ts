// mocks/attributeTypes.ts
import { AttributeType } from "../types/attributes/type.attribute-type"; 

export const ATTRIBUTE_TYPES_MOCK: AttributeType[] = [
  {
    id: "attr-type-1",
    tenantId: "tenant-a",
    name: "Color",
    code: "COLOR",
    inputType: "color",
    isVariant: true,
    affectsSku: true,
    isActive: true,
  },
  {
    id: "attr-type-2",
    tenantId: "tenant-a",
    name: "Talla",
    code: "TALLA",
    inputType: "select",
    isVariant: true,
    affectsSku: true,
    isActive: true,
  },
  {
    id: "attr-type-3",
    tenantId: "tenant-a",
    name: "Material",
    code: "MATERIAL",
    inputType: "text",
    isVariant: false,
    affectsSku: false,
    isActive: true,
  },
  {
    id: "attr-type-4",
    tenantId: "tenant-a",
    name: "Temporada",
    code: "TEMPORADA",
    inputType: "select",
    isVariant: false,
    affectsSku: false,
    isActive: false,
  },
];
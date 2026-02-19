import { Category } from "../types/category/type.category";

export const CATEGORY_MOCKS: Category[] = [
  {
    id: "CAT-HOMBRE",
    name: "Caballeros",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "CAT-MUJER",
    name: "Damas",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Subcategorías
  {
    id: "CAT-TERNOS",
    name: "Ternos",
    parentId: "CAT-HOMBRE", // <- Pertenece a Caballeros
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "CAT-VESTIDOS",
    name: "Vestidos de Gala",
    parentId: "CAT-MUJER", // <- Pertenece a Damas
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "CAT-TRAJES",
    name: "Trajes",
    parentId: "CAT-HOMBRE", // <- Pertenece a Caballeros
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

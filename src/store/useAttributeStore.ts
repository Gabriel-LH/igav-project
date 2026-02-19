import { create } from "zustand";

import { Model } from "../types/attributes/modelo/type.models";
import { Color } from "../types/attributes/color/type.color";
import { COLORS_MOCK } from "../mocks/mock.color";
import { SIZES_MOCK } from "../mocks/mock.sizes";
import { MODELS_MOCK } from "../mocks/mock.model";
import { Size } from "../types/attributes/sizes/type.sizes";
import { Category } from "../types/category/type.category";
import { CATEGORY_MOCKS } from "../mocks/mock.category";

// Asumiendo que creaste el type Model anteriormente
interface AttributeStore {
  colors: Color[];
  sizes: Size[];
  models: Model[];
  categories: Category[];

  // Getters para obtener el objeto completo por ID (Muy útiles para la UI)
  getColorById: (id: string) => Color | undefined;
  getSizeById: (id: string) => Size | undefined;
  getModelById: (id: string) => Model | undefined;
  getCategoryById: (id: string) => Category | undefined;

  // Acciones para el futuro (Admin panel)
  addColor: (color: Color) => void;
  addSize: (size: Size) => void;
  // ... etc
}

export const useAttributeStore = create<AttributeStore>((set, get) => ({
  // Inicializamos con los Mocks, pero luego podrías cargar de una API
  colors: COLORS_MOCK,
  sizes: SIZES_MOCK,
  models: MODELS_MOCK,
  categories: CATEGORY_MOCKS,

  getColorById: (id) => get().colors.find((c) => c.id === id),
  getSizeById: (id) => get().sizes.find((s) => s.id === id),
  getModelById: (id) => get().models.find((m) => m.id === id),
  getCategoryById: (id) => get().categories.find((cat) => cat.id === id),

  addColor: (color) => set((state) => ({ colors: [...state.colors, color] })),
  addSize: (size) => set((state) => ({ sizes: [...state.sizes, size] })),
}));

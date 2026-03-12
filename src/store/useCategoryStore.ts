import { create } from "zustand";
import { Category } from "../types/category/type.category";
import { CATEGORIES_MOCK } from "../mocks/mock.categories";

interface CategoryState {
  categories: Category[];
  setCategories: (categories: Category[]) => void;

  // CRUD básico
  addCategory: (category: Category) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;

  // Acceso
  getCategoryById: (
    tenantId: string,
    categoryId: string,
  ) => Category | undefined;
  getCategoriesByTenant: (tenantId: string) => Category[];

  // Estados
  markAsActive: (categoryId: string) => void;
  markAsInactive: (categoryId: string) => void;

  // Limpieza (opcional)
  removeCategory: (categoryId: string) => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: CATEGORIES_MOCK,
  setCategories: (categories) => set({ categories }),

  // ➕ Agregar categoría
  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, category],
    })),

  // ✏️ Actualizar categoría
  updateCategory: (categoryId, updates) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId ? { ...c, ...updates } : c,
      ),
    })),

  // 🔍 Buscar por ID (multitenant safe)
  getCategoryById: (tenantId, categoryId) =>
    get().categories.find(
      (c) => c.tenantId === tenantId && c.id === categoryId,
    ),

  // 📋 Listar categorías de un tenant
  getCategoriesByTenant: (tenantId) =>
    get().categories.filter((c) => c.tenantId === tenantId),

  // ✅ Marcar como activa
  markAsActive: (categoryId) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              status: "active",
            }
          : c,
      ),
    })),

  // ⏳ Marcar como inactiva
  markAsInactive: (categoryId) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              status: "inactive",
            }
          : c,
      ),
    })),

  // 🗑️ Remover (solo si realmente lo necesitas)
  removeCategory: (categoryId) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== categoryId),
    })),
}));

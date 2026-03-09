import { CategoryRepository } from "../../../domain/tenant/repositories/CategoryRepository";
import { Category } from "../../../types/category/type.category";
import { useCategoryStore } from "../../../store/useCategoryStore";

export class ZustandCategoryRepository implements CategoryRepository {
  addCategory(category: Category): void {
    useCategoryStore.getState().addCategory(category);
  }

  updateCategory(categoryId: string, updates: Partial<Category>): void {
    useCategoryStore.getState().updateCategory(categoryId, updates);
  }

  getCategoryById(tenantId: string, categoryId: string): Category | undefined {
    return useCategoryStore.getState().getCategoryById(tenantId, categoryId);
  }

  getCategoriesByTenant(tenantId: string): Category[] {
    return useCategoryStore.getState().getCategoriesByTenant(tenantId);
  }

  markAsActive(categoryId: string): void {
    useCategoryStore.getState().markAsActive(categoryId);
  }

  markAsInactive(categoryId: string): void {
    useCategoryStore.getState().markAsInactive(categoryId);
  }

  removeCategory(categoryId: string): void {
    useCategoryStore.getState().removeCategory(categoryId);
  }
}

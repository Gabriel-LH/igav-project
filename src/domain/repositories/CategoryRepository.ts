import { Category } from "../../types/category/type.category";

export interface CategoryRepository {
  addCategory(category: Category): void;
  updateCategory(categoryId: string, updates: Partial<Category>): void;
  getCategoryById(tenantId: string, categoryId: string): Category | undefined;
  getCategoriesByTenant(tenantId: string): Category[];
  markAsActive(categoryId: string): void;
  markAsInactive(categoryId: string): void;
  removeCategory(categoryId: string): void;
}
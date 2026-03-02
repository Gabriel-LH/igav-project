import { CategoryRepository } from "../../../domain/repositories/CategoryRepository";
import { Category } from "../../../types/category/type.category";
import { generateSlug } from "../../../utils/category/categoryTree";
import { CreateCategoryInput } from "../../interfaces/category/CreateCategoryInput";
import { UpdateCategoryInput } from "../../interfaces/category/UpdateCategoryInput";

interface DeleteCategoryInput {
  categoryId: string;
  tenantId: string;
}

interface ListCategoriesOptions {
  includeInactive?: boolean;
}

const normalizeParentId = (parentId?: string | null): string | undefined => {
  if (!parentId) return undefined;
  const trimmed = parentId.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isParentFieldPresent = (data: Partial<UpdateCategoryInput>): boolean =>
  Object.prototype.hasOwnProperty.call(data, "parentId");

const findDescendantIds = (categories: Category[], parentId: string): string[] => {
  const descendants: string[] = [];
  const children = categories.filter((category) => category.parentId === parentId);

  for (const child of children) {
    descendants.push(child.id);
    descendants.push(...findDescendantIds(categories, child.id));
  }

  return descendants;
};

export class CreateCategoryUseCase {
  constructor(private categoryRepo: CategoryRepository) {}

  execute(data: CreateCategoryInput): Category {
    const categories = this.categoryRepo.getCategoriesByTenant(data.tenantId);
    const parentId = normalizeParentId(data.parentId);
    const parentCategory = parentId
      ? categories.find((category) => category.id === parentId)
      : undefined;

    if (parentId && !parentCategory) {
      throw new Error("La categoría padre no existe para este tenant.");
    }

    const existingSlugs = categories
      .map((category) => category.slug)
      .filter((slug): slug is string => Boolean(slug));
    const slugBase = data.slug?.trim() || data.name;
    const slug = generateSlug(slugBase, existingSlugs);
    const level = parentCategory ? (parentCategory.level ?? 0) + 1 : 0;
    const parentPath = parentCategory?.path ?? parentCategory?.slug ?? "";
    const path = parentCategory ? `${parentPath}/${slug}` : slug;
    const now = new Date();

    const newCategory: Category = {
      id: `cat-${crypto.randomUUID()}`,
      tenantId: data.tenantId,
      name: data.name,
      description: data.description,
      parentId,
      level,
      path,
      image: data.image,
      color: data.color,
      icon: data.icon,
      slug,
      order: data.order ?? 0,
      isActive: data.isActive ?? true,
      showInPos: data.showInPos ?? true,
      showInEcommerce: data.showInEcommerce ?? true,
      productCount: data.productCount ?? 0,
      totalProductCount: data.totalProductCount ?? 0,
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
    };

    this.categoryRepo.addCategory(newCategory);

    return newCategory;
  }
}

export class UpdateCategoryUseCase {
  constructor(private categoryRepo: CategoryRepository) {}

  execute(data: UpdateCategoryInput): Category {
    const categories = this.categoryRepo.getCategoriesByTenant(data.tenantId);
    const currentCategory = categories.find(
      (category) => category.id === data.categoryId,
    );

    if (!currentCategory) {
      throw new Error("La categoría no existe para este tenant.");
    }

    const parentId = isParentFieldPresent(data)
      ? normalizeParentId(data.parentId)
      : normalizeParentId(currentCategory.parentId);
    const descendants = findDescendantIds(categories, currentCategory.id);

    if (parentId === currentCategory.id) {
      throw new Error("Una categoría no puede ser padre de sí misma.");
    }

    if (parentId && descendants.includes(parentId)) {
      throw new Error("No se puede mover una categoría dentro de sus descendientes.");
    }

    const parentCategory = parentId
      ? categories.find((category) => category.id === parentId)
      : undefined;

    if (parentId && !parentCategory) {
      throw new Error("La categoría padre no existe para este tenant.");
    }

    const categoriesWithoutCurrent = categories.filter(
      (category) => category.id !== currentCategory.id,
    );
    const existingSlugs = categoriesWithoutCurrent
      .map((category) => category.slug)
      .filter((slug): slug is string => Boolean(slug));
    const nextName = data.name ?? currentCategory.name;
    const nextSlug =
      data.slug?.trim() ??
      (data.name
        ? generateSlug(nextName, existingSlugs)
        : (currentCategory.slug ?? generateSlug(nextName, existingSlugs)));
    const nextLevel = parentCategory ? (parentCategory.level ?? 0) + 1 : 0;
    const parentPath = parentCategory?.path ?? parentCategory?.slug ?? "";
    const nextPath = parentCategory ? `${parentPath}/${nextSlug}` : nextSlug;
    const now = new Date();

    this.categoryRepo.updateCategory(currentCategory.id, {
      name: nextName,
      description: data.description ?? currentCategory.description,
      parentId,
      level: nextLevel,
      path: nextPath,
      image: data.image ?? currentCategory.image,
      color: data.color ?? currentCategory.color,
      icon: data.icon ?? currentCategory.icon,
      slug: nextSlug,
      order: data.order ?? currentCategory.order,
      isActive: data.isActive ?? currentCategory.isActive,
      showInPos: data.showInPos ?? currentCategory.showInPos,
      showInEcommerce: data.showInEcommerce ?? currentCategory.showInEcommerce,
      updatedAt: now,
      updatedBy: data.updatedBy,
    });

    const currentPath = currentCategory.path ?? currentCategory.slug ?? "";
    const oldPathPrefix = `${currentPath}/`;
    const nextPathPrefix = `${nextPath}/`;

    categories.forEach((category) => {
      if (category.id === currentCategory.id || !descendants.includes(category.id)) {
        return;
      }

      const relativePath = currentPath && category.path?.startsWith(oldPathPrefix)
        ? category.path.slice(oldPathPrefix.length)
        : category.path?.replace(currentPath, "")?.replace(/^\/+/, "") ?? "";
      const nextCategoryPath = relativePath
        ? `${nextPathPrefix}${relativePath}`
        : nextPath;
      const levelOffset = (currentCategory.level ?? 0) - (category.level ?? 0);

      this.categoryRepo.updateCategory(category.id, {
        path: nextCategoryPath,
        level: nextLevel - levelOffset,
        updatedAt: now,
        updatedBy: data.updatedBy,
      });
    });

    return (
      this.categoryRepo.getCategoryById(data.tenantId, data.categoryId) ?? {
        ...currentCategory,
      }
    );
  }
}

export class DeleteCategoryUseCase {
  constructor(private categoryRepo: CategoryRepository) {}

  execute(data: DeleteCategoryInput): string[] {
    const categories = this.categoryRepo.getCategoriesByTenant(data.tenantId);
    const categoryToDelete = categories.find(
      (category) => category.id === data.categoryId,
    );

    if (!categoryToDelete) {
      throw new Error("La categoría no existe para este tenant.");
    }

    const descendantIds = findDescendantIds(categories, data.categoryId);
    const idsToDelete = [data.categoryId, ...descendantIds];

    idsToDelete.forEach((categoryId) => {
      this.categoryRepo.removeCategory(categoryId);
    });

    return idsToDelete;
  }
}

export class ListCategoriesUseCase {
  constructor(private categoryRepo: CategoryRepository) {}

  execute(tenantId: string, options?: ListCategoriesOptions): Category[] {
    const categories = this.categoryRepo.getCategoriesByTenant(tenantId);
    const includeInactive = options?.includeInactive ?? true;

    return categories
      .filter((category) => includeInactive || category.isActive)
      .sort((a, b) => {
        const levelA = a.level ?? 0;
        const levelB = b.level ?? 0;
        if (levelA !== levelB) return levelA - levelB;

        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;

        return a.name.localeCompare(b.name, "es");
      });
  }
}

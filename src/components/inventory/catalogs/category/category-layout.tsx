"use client";

import { useMemo } from "react";
import { CategoryFormData } from "@/src/types/category/type.category";
import { CategoriesTable } from "./category-table";
import { useCategoryStore } from "@/src/store/useCategoryStore";
import { ZustandCategoryRepository } from "@/src/infrastructure/stores-adapters/ZustandCategoryRepository";
import {
  CreateCategoryUseCase,
  DeleteCategoryUseCase,
  ListCategoriesUseCase,
  UpdateCategoryUseCase,
} from "@/src/application/use-cases/category/crudCategory.usecase";

export function CategoryLayout() {
  const tenantId = "tenant-a";
  const categorySnapshot = useCategoryStore((state) => state.categories);

  const categoryRepo = useMemo(() => new ZustandCategoryRepository(), []);
  const createCategoryUseCase = useMemo(
    () => new CreateCategoryUseCase(categoryRepo),
    [categoryRepo],
  );
  const updateCategoryUseCase = useMemo(
    () => new UpdateCategoryUseCase(categoryRepo),
    [categoryRepo],
  );
  const deleteCategoryUseCase = useMemo(
    () => new DeleteCategoryUseCase(categoryRepo),
    [categoryRepo],
  );
  const listCategoriesUseCase = useMemo(
    () => new ListCategoriesUseCase(categoryRepo),
    [categoryRepo],
  );

  const data = useMemo(
    () => listCategoriesUseCase.execute(tenantId, { includeInactive: true }),
    [categorySnapshot, listCategoriesUseCase],
  );

  const handleCreate = (formData: CategoryFormData) => {
    createCategoryUseCase.execute({
      tenantId,
      name: formData.name,
      description: formData.description,
      parentId: formData.parentId,
      image: formData.image,
      color: formData.color,
      icon: formData.icon,
      slug: formData.slug,
      order: formData.order,
      isActive: formData.isActive,
      showInPos: formData.showInPos,
      showInEcommerce: formData.showInEcommerce,
    });
  };

  const handleUpdate = (id: string, formData: CategoryFormData) => {
    updateCategoryUseCase.execute({
      categoryId: id,
      tenantId,
      name: formData.name,
      description: formData.description,
      parentId: formData.parentId,
      image: formData.image,
      color: formData.color,
      icon: formData.icon,
      slug: formData.slug,
      order: formData.order,
      isActive: formData.isActive,
      showInPos: formData.showInPos,
      showInEcommerce: formData.showInEcommerce,
    });
  };

  const handleDelete = (id: string) => {
    deleteCategoryUseCase.execute({
      categoryId: id,
      tenantId,
    });
  };

  return (
    <div>
      <CategoriesTable
        data={data}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

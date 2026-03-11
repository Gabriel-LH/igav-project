"use client";

import { useState, useTransition } from "react";
import { Category, CategoryFormData } from "@/src/types/category/type.category";
import { CategoriesTable } from "./category-table";
import { toast } from "sonner";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  updateCategoryOrderAction,
  moveCategoryAction,
  getCategoriesAction,
} from "@/src/app/(tenant)/tenant/actions/category.actions";

interface CategoryLayoutProps {
  initialCategories: Category[];
}

export function CategoryLayout({ initialCategories }: CategoryLayoutProps) {
  const [data, setData] = useState<Category[]>(initialCategories);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (formData: CategoryFormData) => {
    startTransition(async () => {
      const result = await createCategoryAction(formData);
      if (result.success && result.data) {
        setData((prev) => [...prev, result.data!]);
        toast.success("Categoría creada correctamente");
      } else {
        toast.error(result.error || "No se pudo crear la categoría");
      }
    });
  };

  const handleUpdate = async (id: string, formData: CategoryFormData) => {
    startTransition(async () => {
      const result = await updateCategoryAction(id, formData);
      if (result.success && result.data) {
        setData((prev) =>
          prev.map((c) => (c.id === id ? result.data! : c)),
        );
        toast.success("Categoría actualizada correctamente");
      } else {
        toast.error(result.error || "No se pudo actualizar la categoría");
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (result.success && result.deletedIds) {
        setData((prev) => prev.filter((c) => !result.deletedIds!.includes(c.id)));
        toast.success("Categoría eliminada correctamente");
      } else {
        toast.error(result.error || "No se pudo eliminar la categoría");
      }
    });
  };

  const handleReorder = async (updates: Array<{ id: string; order: number }>) => {
    startTransition(async () => {
      const result = await updateCategoryOrderAction(updates);
      if (result.success) {
        const orderMap = new Map(updates.map((u) => [u.id, u.order]));
        setData((prev) =>
          prev.map((c) =>
            orderMap.has(c.id) ? { ...c, order: orderMap.get(c.id)! } : c,
          ),
        );
        toast.success("Orden actualizado");
      } else {
        toast.error(result.error || "No se pudo actualizar el orden");
      }
    });
  };

  const handleMove = async (input: { categoryId: string; parentId?: string | null; position?: number }) => {
    startTransition(async () => {
      const result = await moveCategoryAction(input);
      if (result.success) {
        const refreshed = await getCategoriesAction();
        if (refreshed.success && refreshed.data) {
          setData(refreshed.data);
        }
        toast.success("Categoría movida");
      } else {
        toast.error(result.error || "No se pudo mover la categoría");
      }
    });
  };

  return (
    <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
      <CategoriesTable
        data={data}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onReorder={handleReorder}
        onMove={handleMove}
      />
    </div>
  );
}

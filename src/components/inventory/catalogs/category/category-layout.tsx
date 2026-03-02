"use client";

import { useState } from "react";
import { CATEGORIES_MOCK } from "@/src/mocks/mock.categories";
import { CategoryFormData } from "@/src/types/category/type.category";
import { CategoriesTable } from "./category-table";

export function CategoryLayout() {
  const [data, setData] = useState(CATEGORIES_MOCK);

  const handleUpdate = (id: string, formData: CategoryFormData) => {
    if (id === "new") {
      // Crear nueva
      const newCategory = {
        ...formData,
        id: `cat-${Date.now()}`,
        tenantId: "tenant-a",
        level: 0, // Se calcula en backend basado en parentId
        path: formData.name.toLowerCase(),
        productCount: 0,
        totalProductCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setData((prev) => [...prev, newCategory as any]);
    } else {
      // Actualizar
      setData((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...formData, updatedAt: new Date() }
            : item,
        ),
      );
    }
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div>
      <CategoriesTable
        data={data}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

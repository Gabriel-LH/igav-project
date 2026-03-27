"use client";

import { useEffect } from "react";
import { useCategoryStore } from "@/src/store/useCategoryStore";
import { Category } from "@/src/types/category/type.category";

export function CategoryHydrator({ data }: { data: Category[] }) {
  const setCategories = useCategoryStore((state) => state.setCategories);

  useEffect(() => {
    if (data) {
      setCategories(data);
    }
  }, [data, setCategories]);

  return null;
}

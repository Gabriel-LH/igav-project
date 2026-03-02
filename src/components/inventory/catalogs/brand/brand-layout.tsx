"use client";

import { BRANDS_MOCK } from "@/src/mocks/mock.brand";
import { BrandsTable } from "./brand-table";
import { useState } from "react";
import { Brand, BrandFormData } from "@/src/types/brand/type.brand";

export function BrandLayout() {
  const [data, setData] = useState<Brand[]>(BRANDS_MOCK);

  const handleUpdate = (id: string, formData: BrandFormData) => {
    if (id === "new") {
      const newBrand = {
        ...formData,
        id: `brand-${Date.now()}`,
        tenantId: "tenant-a",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setData((prev) => [...prev, newBrand as any]);
    } else {
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
      <BrandsTable
        data={data}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

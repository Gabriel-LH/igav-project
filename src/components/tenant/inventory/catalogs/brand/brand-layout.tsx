"use client"

import { BrandsTable } from "./brand-table";
import { useState, useTransition } from "react";
import { Brand, BrandFormData } from "@/src/types/brand/type.brand";
import { toast } from "sonner";
import { createBrandAction, updateBrandAction, deleteBrandAction } from "@/src/app/(tenant)/tenant/actions/brand.actions";

interface BrandLayoutProps {
  initialBrands: Brand[];
}

export function BrandLayout({ initialBrands }: BrandLayoutProps) {
  const [data, setData] = useState<Brand[]>(initialBrands);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (formData: BrandFormData) => {
    startTransition(async () => {
      const result = await createBrandAction(formData);
      if (result.success && result.data) {
        setData((prev) => [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Marca creada correctamente");
      } else {
        toast.error(result.error || "No se pudo crear la marca");
      }
    });
  };

  const handleUpdate = async (id: string, formData: BrandFormData) => {
    startTransition(async () => {
      const result = await updateBrandAction(id, formData);
      if (result.success && result.data) {
        setData((prev) => prev.map((b) => (b.id === id ? result.data! : b)).sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Marca actualizada correctamente");
      } else {
        toast.error(result.error || "No se pudo actualizar la marca");
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteBrandAction(id);
      if (result.success) {
        setData((prev) => prev.filter((b) => b.id !== id));
        toast.success("Marca eliminada correctamente");
      } else {
        toast.error(result.error || "No se pudo eliminar la marca");
      }
    });
  };

  return (
    <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
      <BrandsTable
        data={data}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

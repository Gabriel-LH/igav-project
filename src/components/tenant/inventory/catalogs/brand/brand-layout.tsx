"use client";

import { BrandsTable } from "./brand-table";
import { useMemo } from "react";
import { BrandFormData } from "@/src/types/brand/type.brand";
import { useBrandStore } from "@/src/store/useBrandStore";
import { ZustandBrandRepository } from "@/src/infrastructure/tenant/stores-adapters/ZustandBrandRepository";
import { ZustandModelRepository } from "@/src/infrastructure/tenant/stores-adapters/ZustandModelRepository";
import {
  CreateBrandUseCase,
  DeleteBrandUseCase,
  ListBrandsUseCase,
  UpdateBrandUseCase,
} from "@/src/application/tenant/use-cases/crudBrand.usecase";
import { toast } from "sonner";

export function BrandLayout() {
  const tenantId = "tenant-a";
  const brandSnapshot = useBrandStore((state) => state.brands);

  const brandRepo = useMemo(() => new ZustandBrandRepository(), []);
  const modelRepo = useMemo(() => new ZustandModelRepository(), []);

  const createBrandUseCase = useMemo(
    () => new CreateBrandUseCase(brandRepo),
    [brandRepo],
  );
  const updateBrandUseCase = useMemo(
    () => new UpdateBrandUseCase(brandRepo),
    [brandRepo],
  );
  const deleteBrandUseCase = useMemo(
    () => new DeleteBrandUseCase(brandRepo, modelRepo),
    [brandRepo, modelRepo],
  );
  const listBrandsUseCase = useMemo(
    () => new ListBrandsUseCase(brandRepo),
    [brandRepo],
  );

  const data = useMemo(
    () => listBrandsUseCase.execute(tenantId, { includeInactive: true }),
    [brandSnapshot, listBrandsUseCase],
  );

  const handleCreate = (formData: BrandFormData) => {
    createBrandUseCase.execute({
      tenantId,
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      logo: formData.logo,
      isActive: formData.isActive,
    });
  };

  const handleUpdate = (id: string, formData: BrandFormData) => {
    updateBrandUseCase.execute({
      tenantId,
      brandId: id,
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      logo: formData.logo,
      isActive: formData.isActive,
    });
  };

  const handleDelete = (id: string) => {
    try {
      deleteBrandUseCase.execute({
        tenantId,
        brandId: id,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la marca.",
      );
    }
  };

  return (
    <div>
      <BrandsTable
        data={data}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

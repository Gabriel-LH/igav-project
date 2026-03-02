"use client";

import { useMemo } from "react";
import { ModelFormData } from "@/src/types/model/type.model";
import { ModelsTable } from "./model-table";
import { useBrandStore } from "@/src/store/useBrandStore";
import { useModelStore } from "@/src/store/useModelStore";
import { ZustandBrandRepository } from "@/src/infrastructure/stores-adapters/ZustandBrandRepository";
import { ZustandModelRepository } from "@/src/infrastructure/stores-adapters/ZustandModelRepository";
import {
  CreateModelUseCase,
  DeleteModelUseCase,
  ListModelsUseCase,
  UpdateModelUseCase,
} from "@/src/application/use-cases/crudModel.usecase";
import { ListBrandsUseCase } from "@/src/application/use-cases/crudBrand.usecase";
import { toast } from "sonner";

export function ModelLayout() {
  const tenantId = "tenant-a";
  const modelSnapshot = useModelStore((state) => state.models);
  const brandSnapshot = useBrandStore((state) => state.brands);

  const modelRepo = useMemo(() => new ZustandModelRepository(), []);
  const brandRepo = useMemo(() => new ZustandBrandRepository(), []);
  const createModelUseCase = useMemo(
    () => new CreateModelUseCase(modelRepo, brandRepo),
    [modelRepo, brandRepo],
  );
  const updateModelUseCase = useMemo(
    () => new UpdateModelUseCase(modelRepo, brandRepo),
    [modelRepo, brandRepo],
  );
  const deleteModelUseCase = useMemo(
    () => new DeleteModelUseCase(modelRepo),
    [modelRepo],
  );
  const listModelsUseCase = useMemo(
    () => new ListModelsUseCase(modelRepo),
    [modelRepo],
  );
  const listBrandsUseCase = useMemo(
    () => new ListBrandsUseCase(brandRepo),
    [brandRepo],
  );

  const models = useMemo(
    () => listModelsUseCase.execute(tenantId, { includeInactive: true }),
    [modelSnapshot, listModelsUseCase],
  );
  const brands = useMemo(
    () => listBrandsUseCase.execute(tenantId, { includeInactive: true }),
    [brandSnapshot, listBrandsUseCase],
  );

  const handleCreate = (formData: ModelFormData) => {
    try {
      createModelUseCase.execute({
        tenantId,
        brandId: formData.brandId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        year: formData.year,
        isActive: formData.isActive,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el modelo.");
    }
  };

  const handleUpdate = (id: string, formData: ModelFormData) => {
    try {
      updateModelUseCase.execute({
        tenantId,
        modelId: id,
        brandId: formData.brandId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        year: formData.year,
        isActive: formData.isActive,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el modelo.");
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteModelUseCase.execute({
        tenantId,
        modelId: id,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el modelo.");
    }
  };
  return (
    <div>
      <ModelsTable
        data={models}
        brands={brands}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

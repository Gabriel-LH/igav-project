"use client";

import { useMemo } from "react";
import { AttributeTypeFormData } from "@/src/types/attributes/type.attribute-type";
import { AttributeTypesTable } from "./attributes-type-table";
import { useAttributeTypeStore } from "@/src/store/useAttributeTypeStore";
import { ZustandAttributeTypeRepository } from "@/src/infrastructure/tenant/stores-adapters/ZustandAttributeTypeRepository";
import { ZustandAttributeValueRepository } from "@/src/infrastructure/tenant/stores-adapters/ZustandAttributeValueRepository";
import {
  CreateAttributeTypeUseCase,
  DeleteAttributeTypeUseCase,
  ListAttributeTypesUseCase,
  UpdateAttributeTypeUseCase,
} from "@/src/application/tenant/use-cases/crudAttributeType.usecase";
import { toast } from "sonner";

export function AttributesLayout() {
  const tenantId = "tenant-a";
  const attributeTypeSnapshot = useAttributeTypeStore(
    (state) => state.attributeTypes,
  );
  const attributeTypeRepo = useMemo(
    () => new ZustandAttributeTypeRepository(),
    [],
  );
  const attributeValueRepo = useMemo(
    () => new ZustandAttributeValueRepository(),
    [],
  );
  const createAttributeTypeUseCase = useMemo(
    () => new CreateAttributeTypeUseCase(attributeTypeRepo),
    [attributeTypeRepo],
  );
  const updateAttributeTypeUseCase = useMemo(
    () => new UpdateAttributeTypeUseCase(attributeTypeRepo),
    [attributeTypeRepo],
  );
  const deleteAttributeTypeUseCase = useMemo(
    () => new DeleteAttributeTypeUseCase(attributeTypeRepo, attributeValueRepo),
    [attributeTypeRepo, attributeValueRepo],
  );
  const listAttributeTypesUseCase = useMemo(
    () => new ListAttributeTypesUseCase(attributeTypeRepo),
    [attributeTypeRepo],
  );

  const data = useMemo(
    () =>
      listAttributeTypesUseCase.execute(tenantId, { includeInactive: true }),
    [attributeTypeSnapshot, listAttributeTypesUseCase],
  );

  const handleCreate = (formData: AttributeTypeFormData) => {
    try {
      createAttributeTypeUseCase.execute({
        tenantId,
        ...formData,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo crear el tipo de atributo.",
      );
    }
  };

  const handleUpdate = (id: string, updatedData: AttributeTypeFormData) => {
    try {
      updateAttributeTypeUseCase.execute({
        tenantId,
        attributeTypeId: id,
        ...updatedData,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el tipo de atributo.",
      );
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteAttributeTypeUseCase.execute({
        tenantId,
        attributeTypeId: id,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el tipo de atributo.",
      );
    }
  };

  return (
    <div>
      <AttributeTypesTable
        data={data}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

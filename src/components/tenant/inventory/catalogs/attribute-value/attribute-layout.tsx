"use client";

import { AttributeValuesTable } from "./attribute-value-table";
import { useMemo } from "react";
import { AttributeValueFormData } from "@/src/types/attributes/type.attribute-value";
import { useAttributeTypeStore } from "@/src/store/useAttributeTypeStore";
import { useAttributeValueStore } from "@/src/store/useAttributeValueStore";
import { ZustandAttributeTypeRepository } from "@/src/infrastructure/stores-adapters/ZustandAttributeTypeRepository";
import { ZustandAttributeValueRepository } from "@/src/infrastructure/stores-adapters/ZustandAttributeValueRepository";
import { ListAttributeTypesUseCase } from "@/src/application/use-cases/crudAttributeType.usecase";
import {
  CreateAttributeValueUseCase,
  DeleteAttributeValueUseCase,
  ListAttributeValuesUseCase,
  UpdateAttributeValueUseCase,
} from "@/src/application/use-cases/crudAttributeValue.usecase";
import { toast } from "sonner";

export function AttributeValueLayout() {
  const tenantId = "tenant-a";
  const attributeTypeSnapshot = useAttributeTypeStore((state) => state.attributeTypes);
  const attributeValueSnapshot = useAttributeValueStore((state) => state.attributeValues);
  const attributeTypeRepo = useMemo(() => new ZustandAttributeTypeRepository(), []);
  const attributeValueRepo = useMemo(() => new ZustandAttributeValueRepository(), []);

  const listAttributeTypesUseCase = useMemo(
    () => new ListAttributeTypesUseCase(attributeTypeRepo),
    [attributeTypeRepo],
  );
  const createAttributeValueUseCase = useMemo(
    () => new CreateAttributeValueUseCase(attributeValueRepo, attributeTypeRepo),
    [attributeTypeRepo, attributeValueRepo],
  );
  const updateAttributeValueUseCase = useMemo(
    () => new UpdateAttributeValueUseCase(attributeValueRepo, attributeTypeRepo),
    [attributeTypeRepo, attributeValueRepo],
  );
  const deleteAttributeValueUseCase = useMemo(
    () => new DeleteAttributeValueUseCase(attributeValueRepo),
    [attributeValueRepo],
  );
  const listAttributeValuesUseCase = useMemo(
    () => new ListAttributeValuesUseCase(attributeValueRepo),
    [attributeValueRepo],
  );

  const data = useMemo(
    () => listAttributeValuesUseCase.execute(tenantId, { includeInactive: true }),
    [attributeValueSnapshot, listAttributeValuesUseCase],
  );
  const types = useMemo(
    () => listAttributeTypesUseCase.execute(tenantId, { includeInactive: true }),
    [attributeTypeSnapshot, listAttributeTypesUseCase],
  );

  const handleCreate = (formData: AttributeValueFormData) => {
    try {
      createAttributeValueUseCase.execute({
        tenantId,
        ...formData,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el valor de atributo.");
    }
  };

  const handleUpdate = (id: string, updatedData: AttributeValueFormData) => {
    try {
      updateAttributeValueUseCase.execute({
        tenantId,
        attributeValueId: id,
        ...updatedData,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar el valor de atributo.",
      );
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteAttributeValueUseCase.execute({
        tenantId,
        attributeValueId: id,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar el valor de atributo.",
      );
    }
  };

  return (
    <div>
      <AttributeValuesTable
        data={data}
        attributeTypes={types}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

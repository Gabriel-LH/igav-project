"use client";

import { useState, useTransition } from "react";
import { AttributeValuesTable } from "./attribute-value-table";
import {
  AttributeValue,
  AttributeValueFormData,
} from "@/src/types/attributes/type.attribute-value";
import { AttributeType } from "@/src/types/attributes/type.attribute-type";
import {
  createAttributeValueAction,
  updateAttributeValueAction,
  deleteAttributeValueAction,
} from "@/src/app/(tenant)/tenant/actions/attribute.actions";
import { toast } from "sonner";

interface AttributeValueLayoutProps {
  initialAttributeValues: AttributeValue[];
  attributeTypes: AttributeType[];
}

export function AttributeValueLayout({
  initialAttributeValues,
  attributeTypes,
}: AttributeValueLayoutProps) {
  const [data, setData] = useState<AttributeValue[]>(initialAttributeValues);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: AttributeValueFormData) => {
    startTransition(async () => {
      const result = await createAttributeValueAction(formData);
      if (result.success && result.data) {
        setData((prev) =>
          [...prev, result.data!].sort((a, b) => a.value.localeCompare(b.value)),
        );
        toast.success("Valor de atributo creado correctamente");
      } else {
        toast.error(result.error || "No se pudo crear el valor de atributo.");
      }
    });
  };

  const handleUpdate = (id: string, updatedData: AttributeValueFormData) => {
    startTransition(async () => {
      const result = await updateAttributeValueAction(id, updatedData);
      if (result.success && result.data) {
        setData((prev) =>
          prev
            .map((item) => (item.id === id ? result.data! : item))
            .sort((a, b) => a.value.localeCompare(b.value)),
        );
        toast.success("Valor de atributo actualizado correctamente");
      } else {
        toast.error(result.error || "No se pudo actualizar el valor de atributo.");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteAttributeValueAction(id);
      if (result.success) {
        setData((prev) => prev.filter((item) => item.id !== id));
        toast.success("Valor de atributo eliminado correctamente");
      } else {
        toast.error(result.error || "No se pudo eliminar el valor de atributo.");
      }
    });
  };

  return (
    <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
      <AttributeValuesTable
        data={data}
        attributeTypes={attributeTypes}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

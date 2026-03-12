"use client";

import { useState, useTransition } from "react";
import {
  AttributeType,
  AttributeTypeFormData,
} from "@/src/types/attributes/type.attribute-type";
import { AttributeTypesTable } from "./attributes-type-table";
import {
  createAttributeTypeAction,
  updateAttributeTypeAction,
  deleteAttributeTypeAction,
} from "@/src/app/(tenant)/tenant/actions/attribute.actions";
import { toast } from "sonner";

interface AttributesLayoutProps {
  initialAttributeTypes: AttributeType[];
}

export function AttributesLayout({ initialAttributeTypes }: AttributesLayoutProps) {
  const [data, setData] = useState<AttributeType[]>(initialAttributeTypes);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: AttributeTypeFormData) => {
    startTransition(async () => {
      const result = await createAttributeTypeAction(formData);
      if (result.success && result.data) {
        setData((prev) =>
          [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name)),
        );
        toast.success("Tipo de atributo creado correctamente");
      } else {
        toast.error(result.error || "No se pudo crear el tipo de atributo.");
      }
    });
  };

  const handleUpdate = (id: string, updatedData: AttributeTypeFormData) => {
    startTransition(async () => {
      const result = await updateAttributeTypeAction(id, updatedData);
      if (result.success && result.data) {
        setData((prev) =>
          prev
            .map((item) => (item.id === id ? result.data! : item))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        toast.success("Tipo de atributo actualizado correctamente");
      } else {
        toast.error(result.error || "No se pudo actualizar el tipo de atributo.");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteAttributeTypeAction(id);
      if (result.success) {
        setData((prev) => prev.filter((item) => item.id !== id));
        toast.success("Tipo de atributo eliminado correctamente");
      } else {
        toast.error(result.error || "No se pudo eliminar el tipo de atributo.");
      }
    });
  };

  return (
    <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
      <AttributeTypesTable
        data={data}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

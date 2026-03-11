"use client"

import { useState, useTransition } from "react";
import { Model, ModelFormData } from "@/src/types/model/type.model";
import { Brand } from "@/src/types/brand/type.brand";
import { ModelsTable } from "./model-table";
import { toast } from "sonner";
import { createModelAction, updateModelAction, deleteModelAction } from "@/src/app/(tenant)/tenant/actions/brand.actions";

interface ModelLayoutProps {
  initialModels: Model[];
  initialBrands: Brand[];
}

export function ModelLayout({ initialModels, initialBrands }: ModelLayoutProps) {
  const [models, setModels] = useState<Model[]>(initialModels);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (formData: ModelFormData) => {
    startTransition(async () => {
      const result = await createModelAction(formData);
      if (result.success && result.data) {
        setModels((prev) => [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Modelo creado correctamente");
      } else {
        toast.error(result.error || "No se pudo crear el modelo");
      }
    });
  };

  const handleUpdate = async (id: string, formData: ModelFormData) => {
    startTransition(async () => {
      const result = await updateModelAction({ ...formData, modelId: id });
      if (result.success && result.data) {
        setModels((prev) => prev.map((m) => (m.id === id ? result.data! : m)).sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Modelo actualizado correctamente");
      } else {
        toast.error(result.error || "No se pudo actualizar el modelo");
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteModelAction(id);
      if (result.success) {
        setModels((prev) => prev.filter((m) => m.id !== id));
        toast.success("Modelo eliminado correctamente");
      } else {
        toast.error(result.error || "No se pudo eliminar el modelo");
      }
    });
  };

  return (
    <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
      <ModelsTable
        data={models}
        brands={initialBrands}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

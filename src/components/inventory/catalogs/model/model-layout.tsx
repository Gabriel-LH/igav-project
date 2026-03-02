"use client";

import { useState } from "react";
import { MODELS_MOCK } from "@/src/mocks/mock.models";
import { BRANDS_MOCK } from "@/src/mocks/mock.brand";
import { ModelFormData } from "@/src/types/model/type.model";
import { ModelsTable } from "./model-table";

export function ModelLayout() {
  const [models, setModels] = useState(MODELS_MOCK);
  const [brands] = useState(BRANDS_MOCK);

  const handleUpdate = (id: string, formData: ModelFormData) => {
    if (id === "new") {
      const newModel = {
        ...formData,
        id: `model-${Date.now()}`,
        tenantId: "tenant-a",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setModels((prev) => [...prev, newModel as any]);
    } else {
      setModels((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...formData, updatedAt: new Date() }
            : item,
        ),
      );
    }
  };

  const handleDelete = (id: string) => {
    setModels((prev) => prev.filter((item) => item.id !== id));
  };
  return (
    <div>
      <ModelsTable
        data={models}
        brands={brands}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

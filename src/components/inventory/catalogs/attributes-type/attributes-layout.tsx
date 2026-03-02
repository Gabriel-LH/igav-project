"use client";

import { ATTRIBUTE_TYPES_MOCK } from "@/src/mocks/mock.attributeType";
import { useState } from "react";
import { AttributeTypeFormData } from "@/src/types/attributes/type.attribute-type";
import { AttributeTypesTable } from "./attributes-type-table";

export function AttributesLayout() {
  const [data, setData] = useState(ATTRIBUTE_TYPES_MOCK);

  const handleUpdate = (id: string, updatedData: AttributeTypeFormData) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item)),
    );
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div>
      <AttributeTypesTable
        data={data}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

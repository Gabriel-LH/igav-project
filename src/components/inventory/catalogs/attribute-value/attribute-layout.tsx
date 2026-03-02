"use client";

import { ATTRIBUTE_TYPES_MOCK } from "@/src/mocks/mock.attributeType";
import { useState } from "react";
import { AttributeValuesTable } from "./attribute-value-table";
import { ATTRIBUTE_VALUES_MOCK } from "@/src/mocks/mock.attributeValue";
import { AttributeValueFormData } from "@/src/types/attributes/type.attribute-value";

export function AttributeValueLayout() {
  const [data, setData] = useState(ATTRIBUTE_VALUES_MOCK);
  const [types] = useState(ATTRIBUTE_TYPES_MOCK);

  const handleUpdate = (id: string, updatedData: AttributeValueFormData) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item)),
    );
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div>
      <AttributeValuesTable
        data={data}
        attributeTypes={types}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

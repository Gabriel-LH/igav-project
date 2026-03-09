// components/inventory/SerializedLayout.tsx
"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { SerializedItemForm } from "./serialized-form";
import { SerializedItemsTable } from "./table/serialized-table";
import { MOCK_BRANCHES } from "@/src/mocks/mock.branch";
import { SerializedItemFormData } from "@/src/application/interfaces/inventory/SerializedItemFormData";
import { ZustandInventoryRepository } from "@/src/infrastructure/stores-adapters/ZustandInventoryRepository";
import { CreateSerializedItemsUseCase } from "@/src/application/use-cases/inventory/createSerializedItems.usecase";
import { DeleteSerializedItemUseCase } from "@/src/application/use-cases/inventory/deleteSerializedItem.usecase";
import { ListSerializedItemsUseCase } from "@/src/application/use-cases/inventory/listSerializedItems.usecase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddToListIcon, ListViewIcon } from "@hugeicons/core-free-icons";

export function SerializedLayout() {
  const [activeTab, setActiveTab] = useState("form");
  const tenantId = "tenant-a";
  const inventoryRepo = useMemo(() => new ZustandInventoryRepository(), []);
  const createSerializedItemsUseCase = useMemo(
    () => new CreateSerializedItemsUseCase(inventoryRepo),
    [inventoryRepo],
  );
  const deleteSerializedItemUseCase = useMemo(
    () => new DeleteSerializedItemUseCase(inventoryRepo),
    [inventoryRepo],
  );
  const listSerializedItemsUseCase = useMemo(
    () => new ListSerializedItemsUseCase(inventoryRepo),
    [inventoryRepo],
  );

  const items = useMemo(
    () =>
      listSerializedItemsUseCase.execute({
        branches: MOCK_BRANCHES,
      }),
    [listSerializedItemsUseCase],
  );

  const handleSubmit = (formData: SerializedItemFormData) => {
    createSerializedItemsUseCase.execute({
      tenantId,
      formData,
    });
  };

  const handleDelete = (id: string) => {
    deleteSerializedItemUseCase.execute({ itemId: id });
  };

  return (
    <div className="container mx-auto space-y-6 lg:py-6 md:py-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="form">
            <HugeiconsIcon icon={AddToListIcon} />
            Crear Serializado
          </TabsTrigger>
          <TabsTrigger value="list">
            <HugeiconsIcon icon={ListViewIcon} />
            Serializados Registrados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <SerializedItemForm onSubmit={handleSubmit} />
        </TabsContent>

        <TabsContent value="list">
          {items.length > 0 && (
            <div>
              <div className="text-2xl mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                <span>Items Serializados ({items.length})</span>
              </div>

              <div>
                <SerializedItemsTable items={items} onDelete={handleDelete} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

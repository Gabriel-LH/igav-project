// components/inventory/SerializedLayout.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { SerializedItemForm } from "./serialized-form";
import { SerializedItemsTable } from "./serialized-table";
import { BRANCH_MOCKS } from "@/src/mocks/mock.branch";
import { SerializedItemFormData } from "@/src/application/interfaces/inventory/SerializedItemFormData";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { ZustandInventoryRepository } from "@/src/infrastructure/stores-adapters/ZustandInventoryRepository";
import { CreateSerializedItemsUseCase } from "@/src/application/use-cases/inventory/createSerializedItems.usecase";
import { DeleteSerializedItemUseCase } from "@/src/application/use-cases/inventory/deleteSerializedItem.usecase";
import { ListSerializedItemsUseCase } from "@/src/application/use-cases/inventory/listSerializedItems.usecase";

export function SerializedLayout() {
  const tenantId = "tenant-a";
  const inventoryItemsState = useInventoryStore((state) => state.inventoryItems);
  const productsState = useInventoryStore((state) => state.products);
  const productVariantsState = useInventoryStore((state) => state.productVariants);
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
        branches: BRANCH_MOCKS,
      }),
    [
      listSerializedItemsUseCase,
      inventoryItemsState,
      productsState,
      productVariantsState,
    ],
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
    <div className="space-y-6 p-6">
      <SerializedItemForm onSubmit={handleSubmit} />

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Items Serializados ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SerializedItemsTable items={items} onDelete={handleDelete} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

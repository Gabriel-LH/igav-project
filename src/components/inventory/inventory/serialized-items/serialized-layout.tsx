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

export function SerializedLayout() {
  const tenantId = "tenant-a";
  const inventoryItems = useInventoryStore((state) => state.inventoryItems);
  const products = useInventoryStore((state) => state.products);
  const productVariants = useInventoryStore((state) => state.productVariants);
  const inventoryRepo = useMemo(() => new ZustandInventoryRepository(), []);
  const createSerializedItemsUseCase = useMemo(
    () => new CreateSerializedItemsUseCase(inventoryRepo),
    [inventoryRepo],
  );

  const items = useMemo(() => {
    return inventoryItems.map((item) => {
      const product = products.find((productItem) => productItem.id === item.productId);
      const variant = productVariants.find(
        (variantItem) => variantItem.id === item.variantId,
      );
      const branch = BRANCH_MOCKS.find((branchMock) => branchMock.id === item.branchId);

      return {
        id: item.id,
        serialCode: item.serialCode,
        productName: product?.name || "Producto",
        variantName:
          variant && Object.values(variant.attributes).length > 0
            ? Object.values(variant.attributes).join(" / ")
            : variant?.variantCode || "Variante",
        variantCode: variant?.variantCode || "",
        branchName: branch?.name || item.branchId,
        condition: item.condition,
        status: item.status,
        isForRent: item.isForRent,
        isForSale: item.isForSale,
        createdAt: item.createdAt,
      };
    });
  }, [inventoryItems, productVariants, products]);

  const handleSubmit = (formData: SerializedItemFormData) => {
    createSerializedItemsUseCase.execute({
      tenantId,
      formData,
    });
  };

  const handleDelete = (id: string) => {
    inventoryRepo.removeInventoryItem(id);
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

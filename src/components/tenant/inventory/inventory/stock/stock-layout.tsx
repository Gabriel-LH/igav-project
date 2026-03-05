// components/inventory/StockLayout.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { StockForm } from "./stock-form";
import { StockTable } from "./table/stock-table";
import { StockFormData } from "@/src/application/interfaces/stock/StockFormData";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { MOCK_BRANCHES } from "@/src/mocks/mock.branch";
import { ZustandInventoryRepository } from "@/src/infrastructure/stores-adapters/ZustandInventoryRepository";
import { CreateStockLotUseCase } from "@/src/application/use-cases/inventory/createStockLot.usecase";
import { DeleteStockLotUseCase } from "@/src/application/use-cases/inventory/deleteStockLot.usecase";
import { ListStockLotsUseCase } from "@/src/application/use-cases/inventory/listStockLots.usecase";

export function StockLayout() {
  const tenantId = "tenant-a";
  const stockLotsState = useInventoryStore((state) => state.stockLots);
  const productsState = useInventoryStore((state) => state.products);
  const productVariantsState = useInventoryStore(
    (state) => state.productVariants,
  );
  const inventoryRepo = useMemo(() => new ZustandInventoryRepository(), []);
  const createStockLotUseCase = useMemo(
    () => new CreateStockLotUseCase(inventoryRepo),
    [inventoryRepo],
  );
  const deleteStockLotUseCase = useMemo(
    () => new DeleteStockLotUseCase(inventoryRepo),
    [inventoryRepo],
  );
  const listStockLotsUseCase = useMemo(
    () => new ListStockLotsUseCase(inventoryRepo),
    [inventoryRepo],
  );

  const stockList = useMemo(
    () =>
      listStockLotsUseCase.execute({
        branches: MOCK_BRANCHES,
      }),
    [listStockLotsUseCase, stockLotsState, productsState, productVariantsState],
  );

  const handleSubmit = (formData: StockFormData) => {
    createStockLotUseCase.execute({ tenantId, formData });
  };

  const handleDelete = (id: string) => {
    deleteStockLotUseCase.execute({ stockLotId: id });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Formulario */}
      <StockForm onSubmit={handleSubmit} />

      {/* Tabla de Stock Existente */}
      {stockList.length > 0 && (
        <div>
          <div className="text-lg flex items-center gap-2 mb-2">
            <Package className="w-5 h-5" />
            Stock Registrado ({stockList.length} lotes)
          </div>
          <div>
            <StockTable stockList={stockList} onDelete={handleDelete} />
          </div>
        </div>
      )}
    </div>
  );
}

// components/inventory/StockLayout.tsx
"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { StockForm } from "./stock-form";
import { StockTable } from "./table/stock-table";
import { StockFormData } from "@/src/application/interfaces/stock/StockFormData";
import { ZustandInventoryRepository } from "@/src/infrastructure/tenant/stores-adapters/ZustandInventoryRepository";
import { CreateStockLotUseCase } from "@/src/application/tenant/use-cases/inventory/createStockLot.usecase";
import { DeleteStockLotUseCase } from "@/src/application/tenant/use-cases/inventory/deleteStockLot.usecase";
import { ListStockLotsUseCase } from "@/src/application/tenant/use-cases/inventory/listStockLots.usecase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddToListIcon, ListViewIcon } from "@hugeicons/core-free-icons";
import { Branch } from "@/src/types/branch/type.branch";

interface Props {
  initialBranches: Branch[];
  initialProductId?: string;
  initialVariantId?: string;
}
export function StockLayout({ 
  initialBranches,
  initialProductId,
  initialVariantId
}: Props) {
  const [activeTab, setActiveTab] = useState("form");
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

  const stockList = useMemo(() => {
    if (!initialBranches?.length) return [];
    return listStockLotsUseCase.execute({
      branches: initialBranches,
    });
  }, [listStockLotsUseCase, initialBranches]);

  const tenantId = initialBranches?.[0]?.tenantId;

  const handleSubmit = (formData: StockFormData) => {
    createStockLotUseCase.execute({ tenantId: tenantId!, formData });
  };

  const handleDelete = (id: string) => {
    deleteStockLotUseCase.execute({ stockLotId: id });
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
            Crear Stock
          </TabsTrigger>
          <TabsTrigger value="list">
            <HugeiconsIcon icon={ListViewIcon} />
            Stock Registrados
          </TabsTrigger>
        </TabsList>
        <TabsContent value="form">
          {/* Formulario */}
          <StockForm 
            onSubmit={handleSubmit} 
            initialBranches={initialBranches} 
            initialProductId={initialProductId}
            initialVariantId={initialVariantId}
          />
        </TabsContent>
        <TabsContent value="list">
          {/* Tabla de Stock Existente */}
          {stockList.length > 0 && (
            <div>
              <div className="text-2xl flex items-center gap-2 mb-4">
                <Package className="w-5 h-5" />
                Stock Registrado ({stockList.length} lotes)
              </div>
              <div>
                <StockTable stockList={stockList} onDelete={handleDelete} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

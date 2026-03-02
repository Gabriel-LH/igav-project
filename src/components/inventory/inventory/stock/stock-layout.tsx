// components/inventory/StockLayout.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { StockForm } from "./stock-form";
import { StockTable } from "./stock-table";
import { StockListItem } from "@/src/application/interfaces/stock/StockListItem";
import { StockFormData } from "@/src/application/interfaces/stock/StockFormData";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { BRANCH_MOCKS } from "@/src/mocks/mock.branch";
import { ZustandInventoryRepository } from "@/src/infrastructure/stores-adapters/ZustandInventoryRepository";
import { CreateStockLotUseCase } from "@/src/application/use-cases/inventory/createStockLot.usecase";

export function StockLayout() {
  const tenantId = "tenant-a";
  const stockLots = useInventoryStore((state) => state.stockLots);
  const products = useInventoryStore((state) => state.products);
  const productVariants = useInventoryStore((state) => state.productVariants);
  const inventoryRepo = useMemo(() => new ZustandInventoryRepository(), []);
  const createStockLotUseCase = useMemo(
    () => new CreateStockLotUseCase(inventoryRepo),
    [inventoryRepo],
  );

  const stockList = useMemo<StockListItem[]>(() => {
    return stockLots.map((stockLot) => {
      const product = products.find((productItem) => productItem.id === stockLot.productId);
      const variant = productVariants.find(
        (variantItem) => variantItem.id === stockLot.variantId,
      );
      const branch = BRANCH_MOCKS.find((branchItem) => branchItem.id === stockLot.branchId);

      return {
        id: stockLot.id,
        productName: product?.name || stockLot.productId,
        variantName:
          variant && Object.values(variant.attributes).length > 0
            ? Object.values(variant.attributes).join(" / ")
            : variant?.variantCode || stockLot.variantId,
        variantCode: variant?.variantCode || stockLot.variantId,
        barcode: stockLot.barcode || variant?.barcode || "",
        branchName: branch?.name || stockLot.branchId,
        quantity: stockLot.quantity,
        status: stockLot.status,
        isForRent: stockLot.isForRent,
        isForSale: stockLot.isForSale,
        expirationDate: stockLot.expirationDate,
        lotNumber: stockLot.lotNumber,
      };
    });
  }, [products, productVariants, stockLots]);

  const handleSubmit = (formData: StockFormData) => {
    createStockLotUseCase.execute({ tenantId, formData });
  };

  const handleDelete = (id: string) => {
    inventoryRepo.removeStockLot(id);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Formulario */}
      <StockForm onSubmit={handleSubmit} />

      {/* Tabla de Stock Existente */}
      {stockList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Stock Registrado ({stockList.length} lotes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StockTable stockList={stockList} onDelete={handleDelete} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

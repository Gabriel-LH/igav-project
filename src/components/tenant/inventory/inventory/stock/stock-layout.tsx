// components/inventory/StockLayout.tsx
"use client";

import { useEffect, useMemo, useState, useTransition, useCallback } from "react";
import { Package, Loader2 } from "lucide-react";
import { StockForm } from "./stock-form";
import { StockTable } from "./table/stock-table";
import { StockFormData } from "@/src/application/interfaces/stock/StockFormData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddToListIcon, ListViewIcon } from "@hugeicons/core-free-icons";
import { Branch } from "@/src/types/branch/type.branch";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { getProductsAction } from "@/src/app/(tenant)/tenant/actions/product.actions";
import { assignStockAction, listStockLotsAction } from "@/src/app/(tenant)/tenant/actions/stock.actions";
import { toast } from "sonner";
import { GLOBAL_BRANCH_ID, useBranchStore } from "@/src/store/useBranchStore";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const { setProducts, setProductVariants, setStockLots, stockLots } = useInventoryStore();
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
  const canUseGlobal = useBranchStore((state) => state.canUseGlobal);
  const isGlobal = canUseGlobal && selectedBranchId === GLOBAL_BRANCH_ID;
  const canAssign = canUseGlobal;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [productsResult, lotsResult] = await Promise.all([
      getProductsAction(),
      listStockLotsAction()
    ]);

    if (productsResult.success && productsResult.data) {
      setProducts(productsResult.data.products);
      setProductVariants(productsResult.data.variants);
    } else if (!productsResult.success) {
      toast.error(productsResult.error || "Error al cargar productos");
    }

    if (lotsResult.success && lotsResult.data) {
      setStockLots(lotsResult.data as any);
    } else if (!lotsResult.success) {
      toast.error(lotsResult.error || "Error al cargar lotes de stock");
    }
    
    setIsLoading(false);
  }, [setProducts, setProductVariants, setStockLots]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (formData: StockFormData) => {
    startTransition(async () => {
      const result = await assignStockAction({
        productId: formData.productId,
        variantId: formData.variantId,
        branchId: formData.branchId,
        quantity: formData.quantity,
        barcode: formData.barcode,
        expirationDate: formData.expirationDate,
        lotNumber: formData.lotNumber,
        isForRent: formData.isForRent,
        isForSale: formData.isForSale,
        condition: formData.condition,
      });

      if (result.success) {
        toast.success("Stock asignado correctamente");
        fetchData(); // Recargar datos para ver el nuevo lote
        setActiveTab("list");
      } else {
        toast.error(result.error || "Error al asignar stock");
      }
    });
  };

  const formattedStockLots = useMemo(() => {
    const products = useInventoryStore.getState().products;
    const variants = useInventoryStore.getState().productVariants;
    const branches = initialBranches;

    return stockLots.map((lot) => {
      const product = products.find((p) => p.id === lot.productId);
      const variant = variants.find((v) => v.id === lot.variantId);
      const branch = branches.find((b) => b.id === lot.branchId);

      return {
        ...lot,
        productName: product?.name || lot.productId,
        variantName: variant
          ? Object.values(variant.attributes || {}).length > 0
            ? Object.values(variant.attributes).join(" / ")
            : variant.variantCode
          : lot.variantId,
        variantCode: variant?.variantCode || lot.variantId,
        branchName: branch?.name || lot.branchId,
        barcode: lot.barcode || variant?.barcode || "",
      };
    });
  }, [stockLots, initialBranches]);

  const visibleStockLots = useMemo(() => {
    if (isGlobal || !selectedBranchId) return formattedStockLots;
    return formattedStockLots.filter((lot) => lot.branchId === selectedBranchId);
  }, [formattedStockLots, isGlobal, selectedBranchId]);

  const handleDelete = (id: string) => {
    console.log("Delete lot:", id);
    toast.info("Funcionalidad de eliminar lote en desarrollo");
  };

  return (
    <div className="container mx-auto space-y-6 lg:py-6 md:py-6">
      <Tabs
        value={canAssign ? activeTab : "list"}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            {canAssign && (
              <TabsTrigger value="form">
                <HugeiconsIcon icon={AddToListIcon} />
                Crear Stock
              </TabsTrigger>
            )}
            <TabsTrigger value="list">
              <HugeiconsIcon icon={ListViewIcon} />
              Stock Registrados
            </TabsTrigger>
          </TabsList>
          {(isLoading || isPending) && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {canAssign && (
          <TabsContent value="form">
            <StockForm 
              onSubmit={handleSubmit} 
              initialBranches={initialBranches} 
              initialProductId={initialProductId}
              initialVariantId={initialVariantId}
              initialBranchId={isGlobal ? undefined : selectedBranchId}
            />
          </TabsContent>
        )}
        <TabsContent value="list">
          {visibleStockLots.length > 0 ? (
            <div>
              <div className="text-2xl flex items-center gap-2 mb-4">
                <Package className="w-5 h-5" />
                Stock Registrado ({visibleStockLots.length} lotes)
              </div>
              <div>
                <StockTable stockList={visibleStockLots as any} onDelete={handleDelete} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
              No hay lotes de stock registrados o sincronizados.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

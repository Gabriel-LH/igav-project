// components/inventory/SerializedLayout.tsx
"use client";

import { useEffect, useMemo, useState, useTransition, useCallback } from "react";
import { Package, Loader2 } from "lucide-react";
import { SerializedItemForm } from "./serialized-form";
import { SerializedItemsTable } from "./table/serialized-table";
import { SerializedItemFormData } from "@/src/application/interfaces/inventory/SerializedItemFormData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddToListIcon, ListViewIcon } from "@hugeicons/core-free-icons";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { getProductsAction } from "@/src/app/(tenant)/tenant/actions/product.actions";
import { assignSerializedAction, listSerializedItemsAction } from "@/src/app/(tenant)/tenant/actions/stock.actions";
import { toast } from "sonner";
import { GLOBAL_BRANCH_ID, useBranchStore } from "@/src/store/useBranchStore";
import { Branch } from "@/src/types/branch/type.branch";

interface Props {
  initialBranches: Branch[];
  initialProductId?: string;
  initialVariantId?: string;
}

export function SerializedLayout({
  initialBranches,
  initialProductId,
  initialVariantId,
}: Props) {
  const [activeTab, setActiveTab] = useState("form");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const { setProducts, setProductVariants, setInventoryItems, inventoryItems } = useInventoryStore();
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
  const canUseGlobal = useBranchStore((state) => state.canUseGlobal);
  const isGlobal = canUseGlobal && selectedBranchId === GLOBAL_BRANCH_ID;
  const canAssign = canUseGlobal;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [productsResult, itemsResult] = await Promise.all([
      getProductsAction(),
      listSerializedItemsAction()
    ]);

    if (productsResult.success && productsResult.data) {
      setProducts(productsResult.data.products);
      setProductVariants(productsResult.data.variants);
    } else if (!productsResult.success) {
      toast.error(productsResult.error || "Error al cargar productos");
    }

    if (itemsResult.success && itemsResult.data) {
      setInventoryItems(itemsResult.data as any);
    } else if (!itemsResult.success) {
      const errorMsg = "error" in itemsResult ? (itemsResult as any).error : "Error al cargar items serializados";
      toast.error(errorMsg);
    }

    setIsLoading(false);
  }, [setProducts, setProductVariants, setInventoryItems]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = (formData: SerializedItemFormData) => {
    startTransition(async () => {
      const result = await assignSerializedAction({
        productId: formData.productId,
        variantId: formData.variantId,
        branchId: formData.branchId,
        serialCodes: formData.serialCodes,
        isForRent: formData.isForRent,
        isForSale: formData.isForSale,
        condition: formData.condition,
        damageNotes: formData.damageNotes,
      });

      if (result.success) {
        toast.success("Items serializados asignados correctamente");
        fetchData();
        setActiveTab("list");
      } else {
        toast.error(result.error || "Error al asignar items serializados");
      }
    });
  };

  const formattedItems = useMemo(() => {
    const products = useInventoryStore.getState().products;
    const variants = useInventoryStore.getState().productVariants;

    return inventoryItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const variant = variants.find((v) => v.id === item.variantId);

      return {
        ...item,
        productName: product?.name || item.productId,
        variantName: variant
          ? Object.values(variant.attributes || {}).length > 0
            ? Object.values(variant.attributes).join(" / ")
            : variant.variantCode
          : item.variantId,
        variantCode: variant?.variantCode || item.variantId,
      };
    });
  }, [inventoryItems]);

  const visibleItems = useMemo(() => {
    if (isGlobal || !selectedBranchId) return formattedItems;
    return formattedItems.filter((item) => item.branchId === selectedBranchId);
  }, [formattedItems, isGlobal, selectedBranchId]);

  const handleDelete = (id: string) => {
    console.log("Delete item:", id);
    toast.info("Funcionalidad de eliminar item en desarrollo");
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
                Crear Serializado
              </TabsTrigger>
            )}
            <TabsTrigger value="list">
              <HugeiconsIcon icon={ListViewIcon} />
              Serializados Registrados
            </TabsTrigger>
          </TabsList>
          {(isLoading || isPending) && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {canAssign && (
          <TabsContent value="form">
            <SerializedItemForm 
              onSubmit={handleSubmit} 
              initialProductId={initialProductId}
              initialVariantId={initialVariantId}
              initialBranchId={isGlobal ? undefined : selectedBranchId}
              initialBranches={initialBranches}
            />
          </TabsContent>
        )}

        <TabsContent value="list">
          {visibleItems.length > 0 ? (
            <div>
              <div className="text-2xl mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                <span>Items Serializados ({visibleItems.length})</span>
              </div>

              <div>
                <SerializedItemsTable items={visibleItems as any} onDelete={handleDelete} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
              No hay items serializados registrados o sincronizados.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

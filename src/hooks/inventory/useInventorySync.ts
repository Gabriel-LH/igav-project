"use client";

import { useEffect } from "react";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useBranchStore, GLOBAL_BRANCH_ID } from "@/src/store/useBranchStore";
import { getBranchInventoryAction } from "@/src/app/(tenant)/tenant/actions/inventory.actions";
import { toast } from "sonner";

export function useInventorySync() {
  const {
    setProducts,
    setProductVariants,
    setInventoryItems,
    setStockLots,
  } = useInventoryStore();
  
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  useEffect(() => {
    let cancelled = false;
    
    const loadInventory = async () => {
      if (!selectedBranchId || selectedBranchId === GLOBAL_BRANCH_ID) {
        setProducts([]);
        setProductVariants([]);
        setInventoryItems([]);
        setStockLots([]);
        return;
      }

      try {
        const result = await getBranchInventoryAction(selectedBranchId);
        if (cancelled) return;
        
        if (!result.success || !result.data) {
          toast.error(result.error || "No se pudo cargar el inventario");
          return;
        }

        setProducts(result.data.products);
        setProductVariants(result.data.variants);
        setInventoryItems(result.data.inventoryItems);
        setStockLots(result.data.stockLots);
      } catch (error) {
        if (!cancelled) {
          toast.error("Error de conexión al cargar el inventario");
        }
      }
    };

    loadInventory();
    
    return () => {
      cancelled = true;
    };
  }, [selectedBranchId, setProducts, setProductVariants, setInventoryItems, setStockLots]);

  return { selectedBranchId };
}

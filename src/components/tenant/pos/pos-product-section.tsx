"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";
import { useEffect } from "react";
import { PosProductCard } from "./ui/POSProductCard";
import { useBranchStore } from "@/src/store/useBranchStore";
import { getBranchInventoryAction } from "@/src/app/(tenant)/tenant/actions/inventory.actions";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ToolsIcon } from "@hugeicons/core-free-icons";
import type { Product } from "@/src/types/product/type.product";
import type { ProductVariant } from "@/src/types/product/type.productVariant";
import type { InventoryItem } from "@/src/types/product/type.inventoryItem";
import type { StockLot } from "@/src/types/product/type.stockLote";

export function PosProductSection() {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockLots, setStockLots] = useState<StockLot[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      if (!selectedBranchId) {
        setProducts([]);
        setProductVariants([]);
        setInventoryItems([]);
        setStockLots([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await getBranchInventoryAction(selectedBranchId);
        if (cancelled) return;

        if (!result.success || !result.data) {
          toast.error(result.error || "No se pudo cargar el inventario");
          return;
        }

        setProducts(result.data.products as Product[]);
        setProductVariants(result.data.variants as ProductVariant[]);
        setInventoryItems(result.data.inventoryItems as InventoryItem[]);
        setStockLots(result.data.stockLots as StockLot[]);
      } catch (error) {
        if (!cancelled) toast.error("Error de red");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadInventory();
    return () => {
      cancelled = true;
    };
  }, [selectedBranchId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.baseSku.toLowerCase().includes(q) ||
        (p.categoryId?.toLowerCase() || "").includes(q),
    );
  }, [products, search]);

  // The POSProductCard already handles grey-out states for out-of-stock items,
  // so we show all active products matching the search query.

  return (
    <div className="flex flex-col h-full">
      {/* Barra de Búsqueda */}
      <div className="p-4 border-b bg-muted/20">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, código o SKU..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground animate-pulse">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-b-violet-600 border-t-violet-300 mx-auto mb-4"/>
            <p className="text-sm font-semibold">Cargando catálogo...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 text-sm">
            No se encontraron productos
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {filtered.map((product) => (
              <PosProductCard 
                key={product.id} 
                product={product as any} 
                inventoryItems={inventoryItems}
                stockLots={stockLots}
                allVariants={productVariants}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

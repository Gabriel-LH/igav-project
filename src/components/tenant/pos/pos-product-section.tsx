"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { PosProductCard } from "./ui/POSProductCard";
import { useBranchStore } from "@/src/store/useBranchStore";

export function PosProductSection() {
  const { products, inventoryItems, stockLots } = useInventoryStore();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.baseSku.toLowerCase().includes(q) ||
        p.categoryId.toLowerCase().includes(q),
    );
  }, [products, search]);

  const availableProducts = useMemo(() => {
    if (!selectedBranchId) return [];
    return filtered.filter((product) => {
      if (product.is_serial) {
        return inventoryItems.some(
          (item) =>
            item.productId === product.id &&
            item.branchId === selectedBranchId &&
            item.status === "disponible",
        );
      }

      return stockLots.some(
        (lot) =>
          lot.productId === product.id &&
          lot.branchId === selectedBranchId &&
          lot.status === "disponible" &&
          lot.quantity > 0,
      );
    });
  }, [filtered, inventoryItems, stockLots, selectedBranchId]);

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
        {availableProducts.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 text-sm">
            No se encontraron productos
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {availableProducts.map((product) => (
              <PosProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

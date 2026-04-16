"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/src/store/useCartStore";
import { HomeCartDrawer } from "./HomeCartDrawer";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/badge";

export function CatalogCartTrigger() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const items = useCartStore((s) => s.items);
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Solo mostrar en el Home / Catálogo, no en el POS ni otros módulos administrativos
  const isCatalog =
    pathname?.includes("/tenant/home") ||
    pathname?.includes("/tenant/product-details");

  if (!isCatalog) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative w-10 h-10 shadow-sm hover:bg-primary/5 group transition-all"
        onClick={() => setOpen(true)}
      >
        <ShoppingCart
          strokeWidth="2.5"
          className="w-7 h-7 text-primary group-hover:scale-110 transition-transform"
        />
        {cartItemsCount > 0 && (
          <Badge className="absolute top-1 right-1 h-3 w-3 flex items-center justify-center p-0 text-[10px] font-bold animate-in zoom-in">
            {cartItemsCount}
          </Badge>
        )}
      </Button>

      <HomeCartDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}

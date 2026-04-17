"use client";

import { useCartStore } from "@/src/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { formatCurrency } from "@/src/utils/currency-format";
import Image from "next/image";
import type { ProductVariant } from "@/src/types/product/type.productVariant";
import type { InventoryItem } from "@/src/types/product/type.inventoryItem";
import type { StockLot } from "@/src/types/product/type.stockLote";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useAttributeStore } from "@/src/store/useAttributeStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useBranchStore } from "@/src/store/useBranchStore";
import { z } from "zod";
import { productSchema } from "@/src/types/product/type.product";
import { usePromotionStore } from "@/src/store/usePromotionStore";
import { useTenantConfigStore } from "@/src/store/useTenantConfigStore";
import { applyPricingEngine } from "@/src/utils/pricing/applyPricingEngine";
import { DEFAULT_TENANT_CONFIG } from "@/src/lib/tenant-defaults";

interface PosProductCardProps {
  product: z.infer<typeof productSchema>;
  inventoryItems: InventoryItem[];
  stockLots: StockLot[];
  allVariants: ProductVariant[];
}

function VariantSelector({
  product,
  type,
  onClose,
  inventoryItems,
  stockLots,
  allVariants,
}: {
  product: z.infer<typeof productSchema>;
  type: "venta" | "alquiler";
  onClose: () => void;
  inventoryItems: InventoryItem[];
  stockLots: StockLot[];
  allVariants: ProductVariant[];
}) {
  const { addItem, items } = useCartStore();
  const currentBranchId = useBranchStore((s) => s.selectedBranchId);

  const validVariants = useMemo(() => {
    return allVariants.filter((v) => v.productId === product.id && v.isActive);
  }, [product.id, allVariants]);

  const handleConfirm = (variantId: string) => {
    let variantStock;
    if (product.is_serial) {
      variantStock = inventoryItems.filter(
        (i) =>
          i.productId === product.id &&
          i.variantId === variantId &&
          i.branchId === currentBranchId &&
          i.status === "disponible" &&
          (type === "venta" ? i.isForSale : i.isForRent),
      );
    } else {
      variantStock = stockLots.filter(
        (l) =>
          l.productId === product.id &&
          l.variantId === variantId &&
          l.branchId === currentBranchId &&
          l.status === "disponible" &&
          (type === "venta" ? l.isForSale : l.isForRent),
      );
    }

    const totalPhysicalQty = variantStock.reduce(
      (acc, curr) =>
        acc + (product.is_serial ? 1 : (curr as any).quantity || 0),
      0,
    );

    addItem(product, type, undefined, totalPhysicalQty, variantId);
    onClose();
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Variantes Disponibles
        </span>
        <div className="flex flex-col gap-2">
          {validVariants.map((v) => {
            let variantStockItems;
            if (product.is_serial) {
              variantStockItems = inventoryItems.filter(
                (i) =>
                  i.productId === product.id &&
                  i.variantId === v.id &&
                  i.branchId === currentBranchId &&
                  i.status === "disponible" &&
                  (type === "venta" ? i.isForSale : i.isForRent),
              );
            } else {
              variantStockItems = stockLots.filter(
                (l) =>
                  l.productId === product.id &&
                  l.variantId === v.id &&
                  l.branchId === currentBranchId &&
                  l.status === "disponible" &&
                  (type === "venta" ? l.isForSale : l.isForRent),
              );
            }

            const totalPhysicalQty = variantStockItems.reduce(
              (acc, curr) =>
                acc + (product.is_serial ? 1 : (curr as any).quantity || 0),
              0,
            );

            const quantityInCart =
              items.find(
                (i) =>
                  i.product.id === product.id &&
                  i.operationType === type &&
                  i.variantId === v.id,
              )?.quantity || 0;

            const remainingQty = Math.max(0, totalPhysicalQty - quantityInCart);

            return (
              <Button
                key={v.id}
                variant="outline"
                disabled={remainingQty <= 0}
                onClick={() => handleConfirm(v.id)}
                className="flex items-center justify-between gap-1 text-xs rounded-lg shadow-sm hover:scale-105 transition-transform"
              >
                <span>
                  {v.variantSignature?.replace(/\|/g, " - ") || "Única"}
                </span>
                <Badge
                  variant={remainingQty > 0 ? "secondary" : "destructive"}
                  className="text-[9px] h-4 px-1"
                >
                  {remainingQty} disp.
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PosProductCard({
  product,
  inventoryItems,
  stockLots,
  allVariants,
}: PosProductCardProps) {
  const router = useRouter();
  const { addItem, items } = useCartStore();
  const { getCategoryById } = useAttributeStore();
  const currentBranchId = useBranchStore((s) => s.selectedBranchId);

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [operationType, setOperationType] = useState<"venta" | "alquiler">(
    "venta",
  );

  // Logic to calculate total stock based on new structure
  const {
    totalPhysicalStock,
    stockForSale,
    stockForRent,
    hasVariants,
    productVariants,
    maxDiscountPercent,
    relatedBundles,
  } = useMemo(() => {
    const promos = usePromotionStore.getState().promotions;
    const config =
      useTenantConfigStore.getState().config || (DEFAULT_TENANT_CONFIG as any);
    const policy = useTenantConfigStore.getState().policy;

    let itemsForBranch: any[] = [];
    if (product.is_serial) {
      itemsForBranch = inventoryItems.filter(
        (i) =>
          i.productId === product.id &&
          i.branchId === currentBranchId &&
          i.status === "disponible",
      );
    } else {
      itemsForBranch = stockLots.filter(
        (l) =>
          l.productId === product.id &&
          l.branchId === currentBranchId &&
          l.status === "disponible",
      );
    }

    const total = itemsForBranch.reduce(
      (acc, curr) => acc + (product.is_serial ? 1 : curr.quantity || 0),
      0,
    );

    const forSale = itemsForBranch
      .filter((i) => i.isForSale)
      .reduce(
        (acc, curr) => acc + (product.is_serial ? 1 : curr.quantity || 0),
        0,
      );

    const forRent = itemsForBranch
      .filter((i) => i.isForRent)
      .reduce(
        (acc, curr) => acc + (product.is_serial ? 1 : curr.quantity || 0),
        0,
      );

    const variants = itemsForBranch.some((i) => i.variantId);

    const v = allVariants.filter(
      (variant) => variant.productId === product.id && variant.isActive,
    );

    return {
      totalPhysicalStock: total,
      stockForSale: forSale,
      stockForRent: forRent,
      hasVariants: variants,
      itemsForBranch,
      productVariants: v,
      maxDiscountPercent: (() => {
        let maxPct = 0;
        v.forEach((variant) => {
          // Check Sale discount
          if (product.can_sell && variant.priceSell) {
            const result = applyPricingEngine({
              product,
              operationType: "venta",
              listPrice: variant.priceSell,
              promotions: promos,
              config,
              policy,
            });
            if (result.discountAmount > 0) {
              const pct = (result.discountAmount / result.listPrice) * 100;
              if (pct > maxPct) maxPct = pct;
            }
          }
          // Check Rent discount
          if (product.can_rent && variant.priceRent) {
            const result = applyPricingEngine({
              product,
              operationType: "alquiler",
              listPrice: variant.priceRent,
              promotions: promos,
              config,
              policy,
            });
            if (result.discountAmount > 0) {
              const pct = (result.discountAmount / result.listPrice) * 100;
              if (pct > maxPct) maxPct = pct;
            }
          }
        });
        return Math.round(maxPct);
      })(),
      relatedBundles: promos
        .filter(
          (p) =>
            p.isActive &&
            !p.isDeleted &&
            p.type === "bundle" &&
            p.bundleConfig?.requiredProductIds.includes(product.id),
        )
        .map((p) => p.name),
    };
  }, [product, allVariants, inventoryItems, currentBranchId, stockLots]);

  const inCartSale = items
    .filter((i) => i.product.id === product.id && i.operationType === "venta")
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const inCartRent = items
    .filter(
      (i) => i.product.id === product.id && i.operationType === "alquiler",
    )
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const remainingForSale = stockForSale - inCartSale;
  const remainingForRent = stockForRent - inCartRent;

  const handleClick = (type: "venta" | "alquiler") => {
    if (hasVariants) {
      setOperationType(type);
      setSelectorOpen(true);
    } else {
      addItem(
        product,
        type,
        undefined,
        type === "venta" ? remainingForSale : remainingForRent,
      );
    }
  };

  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
        <div
          className="relative aspect-square w-full overflow-hidden rounded-t-2xl"
          onClick={() =>
            router.push(
              `/tenant/product-details/${encodeURIComponent(product.id)}`,
            )
          }
        >
          {product.image ? (
            <Image
              src={product.image[0]}
              alt={product.name}
              width={512}
              height={512}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Image
              src={"/images/fallback_image.png"}
              alt={product.name}
              width={512}
              height={512}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}

          <div className="pointer-events-none absolute top-2 right-2 z-20 flex gap-1">
            {product.can_rent && stockForRent > 0 ? (
              <Badge className="bg-amber-100/90 border-amber-200 text-[9px] font-bold text-amber-800 backdrop-blur-sm">
                Alquiler
              </Badge>
            ) : product.can_sell && stockForSale > 0 ? (
              <Badge className="bg-slate-900/80 border-none text-[9px] font-bold text-white backdrop-blur-sm">
                Venta
              </Badge>
            ) : null}
          </div>

          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {product.can_rent ? (
              <Badge className="bg-blue-600/90 text-white text-xs shadow-md backdrop-blur-sm font-bold">
                {formatCurrency(
                  productVariants.length > 0
                    ? Math.min(
                        ...productVariants.map((v) => v.priceRent || Infinity),
                      )
                    : 0,
                )}
                {productVariants[0]?.rentUnit === "día" && " /día"}
                {productVariants[0]?.rentUnit === "evento" && " /evento"}
              </Badge>
            ) : product.can_sell ? (
              <Badge className="bg-emerald-600/90 text-white text-xs shadow-md backdrop-blur-sm font-bold">
                {formatCurrency(
                  productVariants.length > 0
                    ? Math.min(
                        ...productVariants.map((v) => v.priceSell || Infinity),
                      )
                    : 0,
                )}
              </Badge>
            ) : null}

            {maxDiscountPercent > 0 && (
              <Badge className="bg-rose-600 text-white text-[10px] shadow-lg backdrop-blur-md font-black border-none animate-pulse">
                -{maxDiscountPercent}%
              </Badge>
            )}
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {relatedBundles.length > 0 && (
              <Badge
                className="bg-amber-100/95 text-amber-800 border-amber-200 text-[10px] font-bold shadow-sm backdrop-blur-sm"
                title={relatedBundles.join(", ")}
              >
                {relatedBundles.length === 1
                  ? "COMBO"
                  : `${relatedBundles.length} COMBOS`}
              </Badge>
            )}
            <Badge
              variant={product.is_serial ? "secondary" : "outline"}
              className={cn(
                "text-xs shadow-md backdrop-blur-sm",
                product.is_serial
                  ? "bg-blue-100/90 text-blue-700 border-blue-200"
                  : "bg-white/90 text-gray-600",
              )}
            >
              {product.is_serial ? "Serial" : "Lote"}
            </Badge>

            {totalPhysicalStock > 0 ? (
              <Badge
                variant="outline"
                className="bg-white/90 text-emerald-700 border-emerald-200 text-xs shadow-md font-semibold backdrop-blur-sm"
              >
                Stock: {totalPhysicalStock}
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs shadow-md">
                Agotado
              </Badge>
            )}
          </div>
        </div>

        <div className="px-2 pb-1 flex flex-col flex-1 gap-2">
          <div className="flex flex-col gap-1">
            <h3
              className="font-bold text-sm line-clamp-2 leading-snug"
              title={product.name}
            >
              {product.name}
            </h3>
            <div className="flex flex-col gap-0.5 min-h-[32px]">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {product.categoryId
                  ? getCategoryById(product.tenantId, product.categoryId)?.name
                  : "General"}
              </p>
            </div>
          </div>
          <div className="flex flex-col mt-auto gap-2">
            {product.can_rent ? (
              <Button
                variant="outline"
                size="sm"
                disabled={remainingForRent <= 0}
                className={cn(
                  "flex flex-col items-center justify-between py-2 px-2 gap-1 rounded-lg shadow-sm bg-blue-50/50 hover:bg-blue-100/60 hover:scale-105 transition-transform relative overflow-hidden",
                  remainingForRent <= 0 &&
                    "opacity-50 grayscale cursor-not-allowed bg-gray-100 border-gray-200",
                )}
                onClick={() => handleClick("alquiler")}
              >
                {inCartRent > 0 && stockForRent > 0 && (
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-blue-400/50 transition-all duration-300"
                    style={{ width: `${(inCartRent / stockForRent) * 100}%` }}
                  />
                )}
                <div className="flex justify-between w-full text-xs font-semibold text-blue-600 items-center">
                  <span>Alquilar</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] h-4 px-1 bg-white/80 text-blue-700"
                  >
                    {remainingForRent} disp.
                  </Badge>
                </div>
              </Button>
            ) : product.can_sell ? (
              <Button
                variant="outline"
                size="sm"
                disabled={remainingForSale <= 0}
                className={cn(
                  "flex flex-col items-center justify-between py-2 px-2 gap-1 rounded-lg shadow-sm bg-emerald-50/50 hover:bg-emerald-100/60 hover:scale-105 transition-transform relative overflow-hidden",
                  remainingForSale <= 0 &&
                    "opacity-50 grayscale cursor-not-allowed bg-gray-100 border-gray-200",
                )}
                onClick={() => handleClick("venta")}
              >
                {inCartSale > 0 && stockForSale > 0 && (
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-emerald-400/50 transition-all duration-300"
                    style={{ width: `${(inCartSale / stockForSale) * 100}%` }}
                  />
                )}
                <div className="flex justify-between w-full text-xs font-semibold text-emerald-600 items-center">
                  <span>Vender</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] h-4 px-1 bg-white/80 text-emerald-900"
                  >
                    {remainingForSale} disp.
                  </Badge>
                </div>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/60">
              Seleccionar Variante - {product.name}
            </DialogTitle>
            <DialogDescription>
              Por favor, elige la variante específica que deseas añadir al
              carrito para la {operationType}.
            </DialogDescription>
          </DialogHeader>

          <VariantSelector
            product={product}
            type={operationType}
            onClose={() => setSelectorOpen(false)}
            inventoryItems={inventoryItems}
            stockLots={stockLots}
            allVariants={allVariants}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

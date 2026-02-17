"use client";

import { Product } from "@/src/types/product/type.product";
import { useCartStore } from "@/src/store/useCartStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { formatCurrency } from "@/src/utils/currency-format";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { USER_MOCK } from "@/src/mocks/mock.user";

interface PosProductCardProps {
  product: Product;
}

function VariantSelector({
  product,
  type,
  onClose,
}: {
  product: Product;
  type: "venta" | "alquiler";
  onClose: () => void;
}) {
  const { inventoryItems, stockLots } = useInventoryStore();
  const { addItem, items } = useCartStore();
  const currentBranchId = USER_MOCK[0].branchId;

  // 1. Obtener la fuente de stock correcta según si es seriado o no
  const availableInventory = useMemo(() => {
    if (product.is_serial) {
      return inventoryItems.filter(
        (i) =>
          i.productId === product.id &&
          i.branchId === currentBranchId &&
          i.status === "disponible" &&
          (type === "venta" ? i.isForSale : i.isForRent),
      );
    } else {
      return stockLots.filter(
        (l) =>
          l.productId === product.id &&
          l.branchId === currentBranchId &&
          l.status === "disponible" &&
          (type === "venta" ? l.isForSale : l.isForRent),
      );
    }
  }, [
    product.id,
    product.is_serial,
    inventoryItems,
    stockLots,
    currentBranchId,
    type,
  ]);

  // 2. Extraer tallas únicas de la fuente seleccionada
  const sizes = useMemo(
    () => Array.from(new Set(availableInventory.map((item) => item.size))),
    [availableInventory],
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // 3. Extraer colores únicos para la talla seleccionada
  const colors = useMemo(() => {
    if (!selectedSize) return [];
    return Array.from(
      new Set(
        availableInventory
          .filter((item) => item.size === selectedSize)
          .map((item) => item.color),
      ),
    );
  }, [availableInventory, selectedSize]);

  const handleConfirm = (color: string) => {
    const variantStock = availableInventory.filter(
      (item) => item.size === selectedSize && item.color === color,
    );

    // Sumamos la cantidad total física disponible para esta variante
    const totalPhysicalQty = variantStock.reduce(
      (acc, curr) =>
        acc + (product.is_serial ? 1 : (curr as any).quantity || 0),
      0,
    );

    addItem(product, type, undefined, totalPhysicalQty, {
      size: selectedSize!,
      color,
    });
    onClose();
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          1. Talla
        </span>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <Button
              key={size}
              variant={selectedSize === size ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSize(size)}
              className="w-10 h-10 p-0 rounded-lg shadow-sm hover:scale-105 transition-transform"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {selectedSize && (
        <div className="space-y-2 animate-in fade-in">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            2. Color
          </span>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const variantStockItems = availableInventory.filter(
                (item) => item.size === selectedSize && item.color === color,
              );

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
                    i.selectedSize === selectedSize &&
                    i.selectedColor === color,
                )?.quantity || 0;

              const remainingQty = Math.max(
                0,
                totalPhysicalQty - quantityInCart,
              );

              return (
                <Button
                  key={color}
                  variant="outline"
                  disabled={remainingQty <= 0}
                  onClick={() => handleConfirm(color)}
                  className="flex items-center gap-1 text-xs rounded-lg shadow-sm hover:scale-105 transition-transform"
                >
                  {color}
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
      )}
    </div>
  );
}

export function PosProductCard({ product }: PosProductCardProps) {
  const { addItem, items } = useCartStore();
  const { inventoryItems, stockLots } = useInventoryStore();
  const currentBranchId = USER_MOCK[0].branchId;

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [operationType, setOperationType] = useState<"venta" | "alquiler">(
    "venta",
  );

  // Logic to calculate total stock based on new structure
  const { totalPhysicalStock, stockForSale, stockForRent, hasVariants } =
    useMemo(() => {
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

      const variants = itemsForBranch.some((i) => i.size || i.color);

      return {
        totalPhysicalStock: total,
        stockForSale: forSale,
        stockForRent: forRent,
        hasVariants: variants,
        itemsForBranch,
      };
    }, [
      product.id,
      product.is_serial,
      inventoryItems,
      stockLots,
      currentBranchId,
    ]);

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
        <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400 gap-2">
              <ShoppingBag className="w-8 h-8 opacity-30" />
              <span className="text-xs">Sin imagen</span>
            </div>
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {product.can_sell && (
              <Badge className="bg-emerald-600/90 text-white text-xs shadow-md backdrop-blur-sm font-bold">
                {formatCurrency(product.price_sell ?? 0)}
              </Badge>
            )}

            {product.can_rent && (
              <Badge className="bg-blue-600/90 text-white text-xs shadow-md backdrop-blur-sm font-bold">
                {formatCurrency(product.price_rent ?? 0)}
                {product.rent_unit === "día" && " /día"}
                {product.rent_unit === "evento" && " /evento"}
              </Badge>
            )}
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
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

        <div className="p-4 flex flex-col flex-1 gap-2">
          <div className="flex flex-col gap-1">
            <h3
              className="font-bold text-sm line-clamp-2 leading-snug"
              title={product.name}
            >
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 uppercase tracking-wide truncate">
              {product.category || "General"}
            </p>
          </div>

          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {product.can_sell ? (
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
                    className="text-[9px] h-4 px-1 bg-white/50 text-emerald-700"
                  >
                    {remainingForSale} disp.
                  </Badge>
                </div>
              </Button>
            ) : (
              <div className="rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center text-[10px] font-bold py-2 border border-red-200">
                NO VENTA
              </div>
            )}

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
                    className="text-[9px] h-4 px-1 bg-white/50 text-blue-700"
                  >
                    {remainingForRent} disp.
                  </Badge>
                </div>
              </Button>
            ) : (
              <div className="rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center text-[10px] font-bold py-2 border border-red-200">
                NO RENTA
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogContent className="max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Seleccionar variante ({operationType})</DialogTitle>
            <DialogDescription>
              Selecciona la variante del producto que deseas agregar al carrito.
            </DialogDescription>
          </DialogHeader>
          <VariantSelector
            product={product}
            type={operationType}
            onClose={() => setSelectorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useMemo } from "react";
import { CartItem } from "@/src/types/cart/type.cart";
import { useCartStore } from "@/src/store/useCartStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useAttributeStore } from "@/src/store/useAttributeStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { Trash2, Minus, Plus, QrCode } from "lucide-react";
import { formatCurrency } from "@/src/utils/currency-format";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StockAssignmentWidget } from "../home/ui/widget/StockAssignmentWidget";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { differenceInDays } from "date-fns";

interface PosCartItemProps {
  item: CartItem;
}

export function PosCartItem({ item }: PosCartItemProps) {
  const { removeItem, updateQuantity, updateSelectedStock, globalRentalDates } =
    useCartStore();
  const { inventoryItems, stockLots } = useInventoryStore();

  const currentBranchId = USER_MOCK[0].branchId;
  const isRent = item.operationType === "alquiler";
  const isSerial = item.product.is_serial;

  // Variantes
  const variant = {
    sizeId: item.selectedSizeId || "",
    colorId: item.selectedColorId || "",
  };

  const { getSizeById, getColorById, getCategoryById, getModelById } =
    useAttributeStore();

  // 1. Obtener disponibilidad REAL de este producto/variante en el local
  const maxAvailable = useMemo(() => {
    if (isSerial) {
      return inventoryItems.filter(
        (i) =>
          i.productId === item.product.id &&
          i.sizeId === variant.sizeId &&
          i.colorId === variant.colorId &&
          i.branchId === currentBranchId &&
          i.status === "disponible" &&
          (isRent ? i.isForRent : i.isForSale),
      ).length;
    } else {
      const lot = stockLots.find(
        (l) =>
          l.productId === item.product.id &&
          l.sizeId === variant.sizeId &&
          l.colorId === variant.colorId &&
          l.branchId === currentBranchId &&
          l.status === "disponible" &&
          (isRent ? l.isForRent : l.isForSale),
      );
      return lot ? lot.quantity : 0;
    }
  }, [
    inventoryItems,
    stockLots,
    item.product.id,
    variant,
    isRent,
    currentBranchId,
    isSerial,
  ]);

  // 2. Controladores
  const handleQuantityChange = (val: number) => {
    if (val < 1) return;
    if (val > maxAvailable) return;
    updateQuantity(item.cartId, val);
  };

  const dateRange = useMemo(
    () => ({
      from: globalRentalDates?.from || new Date(),
      to: globalRentalDates?.to || new Date(),
    }),
    [globalRentalDates],
  );

  const days = useMemo(() => {
    if (!globalRentalDates) return 1;
    return Math.max(
      differenceInDays(globalRentalDates.to, globalRentalDates.from),
      1,
    );
  }, [globalRentalDates]);

  return (
    <div
      className={`flex flex-col gap-2 p-3 border rounded-lg shadow-sm transition-all group ${
        item.bundleId
          ? "border-blue-200 bg-blue-50/10"
          : "hover:border-slate-900"
      }`}
    >
      {item.bundleId && (
        <div className="flex items-center gap-1 -mt-1 -mx-3 px-3 py-1 bg-blue-100/50 rounded-t-lg border-b border-blue-200 mb-2">
          <span className="text-[8px] font-black uppercase text-blue-600 tracking-widest">
            Item de Pack
          </span>
        </div>
      )}
      {/* 1. Header: Nombre y Variantes */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col">
          <span className="font-bold text-xs line-clamp-2 leading-tight">
            {item.product.name}
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] text-muted-foreground mr-1">
              {item.product.categoryId
                ? getCategoryById(item.product.categoryId)?.name
                : "Gen"}
              {item.product.modelId && (
                <span className="ml-1 text-slate-400 font-bold italic">
                  -{" "}
                  {getModelById(item.product.modelId)?.name ||
                    item.product.modelId}
                </span>
              )}
            </span>
            {variant.sizeId && (
              <Badge variant="secondary" className="text-[9px] h-3.5 px-1 py-0">
                Talla: {getSizeById(variant.sizeId)?.name || variant.sizeId}
              </Badge>
            )}
            {variant.colorId && (
              <Badge variant="secondary" className="text-[9px] h-3.5 px-1 py-0">
                Color: {getColorById(variant.colorId)?.name || variant.colorId}
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => removeItem(item.cartId)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* 2. Operación, Cantidad y Disponibilidad */}
      <div className="flex items-end justify-between mt-1">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Badge
              variant={isRent ? "default" : "secondary"}
              className={`text-[9px] px-1.5 h-4 w-fit uppercase font-bold ${
                isRent
                  ? "bg-blue-500 text-white"
                  : "bg-emerald-100 text-emerald-700 font-black"
              }`}
            >
              {isRent ? "ALQUILER" : "VENTA"}
            </Badge>

            {!isSerial && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-bold ${item.quantity >= maxAvailable ? "text-amber-600" : "text-slate-400"}`}
                >
                  {maxAvailable} disp.
                </span>
                {item.quantity >= maxAvailable && (
                  <Badge className="text-[8px] h-3.5 px-1 bg-amber-500/40 text-white border-0 hover:bg-amber-600">
                    MÁXIMO
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isSerial ? (
            /* SERIALIZADO: Botón de Asignación */
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-7 text-[10px] px-2 border-dashed ${
                    item.selectedCodes.length !== item.quantity
                      ? "border-amber-400 bg-amber-50 text-amber-600"
                      : "border-emerald-300 bg-emerald-50 text-emerald-500"
                  }`}
                >
                  <QrCode className="w-3 h-3 mr-1" />
                  {item.selectedCodes.length} / {item.quantity} Asignados
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" side="right">
                <StockAssignmentWidget
                  productId={item.product.id}
                  sizeId={variant.sizeId}
                  colorId={variant.colorId}
                  quantity={item.quantity}
                  operationType={item.operationType}
                  dateRange={dateRange}
                  currentBranchId={currentBranchId}
                  isSerial={true}
                  isImmediate={true}
                  initialSelections={item.selectedCodes}
                  onAssignmentChange={(codes) =>
                    updateSelectedStock(item.cartId, codes)
                  }
                />
              </PopoverContent>
            </Popover>
          ) : (
            /* LOTE: Stepper con Límite */
            <div className="flex items-center border rounded-md h-7 w-fit  overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-6 rounded-none hover:bg-slate-100 border-r"
                onClick={() => handleQuantityChange(item.quantity - 1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <div className="w-8 text-center text-xs font-black tabular-nums">
                {item.quantity}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`h-full w-6 rounded-none border-l transition-opacity ${
                  item.quantity >= maxAvailable
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-slate-100"
                }`}
                disabled={item.quantity >= maxAvailable}
                onClick={() => handleQuantityChange(item.quantity + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* 3. Precios */}
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground font-medium">
            {isRent && item.product.rent_unit !== "evento" ? (
              <span className="text-blue-500 font-bold">
                {item.listPrice && item.listPrice > item.unitPrice && (
                  <span className="line-through opacity-50 mr-1 text-slate-400">
                    {formatCurrency(item.listPrice)}
                  </span>
                )}
                {formatCurrency(item.unitPrice)} x {days}{" "}
                {days === 1 ? "día" : "días"}
              </span>
            ) : (
              <div className="flex flex-col">
                {item.listPrice && item.listPrice > item.unitPrice && (
                  <span className="line-through opacity-50 text-[9px] text-slate-400">
                    {formatCurrency(item.listPrice)}
                  </span>
                )}
                <span>{formatCurrency(item.unitPrice)} c/u</span>
              </div>
            )}
          </div>

          {item.discountAmount && item.discountAmount > 0 ? (
            <div className="text-[9px] text-emerald-600 font-bold mt-0.5 animate-pulse">
              Ahorras {formatCurrency(item.discountAmount * item.quantity)}
              {item.discountReason && (
                <span className="block italic opacity-80 font-medium">
                  ({item.discountReason})
                </span>
              )}
            </div>
          ) : null}

          <div className="text-sm font-black text-slate-700 mt-1">
            {formatCurrency(item.subtotal)}
          </div>
        </div>
      </div>
    </div>
  );
}

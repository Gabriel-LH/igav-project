"use client";

import { useMemo } from "react";
import { CartItem } from "@/src/types/cart/type.cart";
import { useCartStore } from "@/src/store/useCartStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { Trash2, Barcode, Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/src/utils/currency-format";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StockAssignmentWidget } from "../home/ui/widget/StockAssigmentWidget";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { addDays } from "date-fns";

interface PosCartItemProps {
  item: CartItem;
}

export function PosCartItem({ item }: PosCartItemProps) {
  const { removeItem, updateQuantity, updateSelectedStock, globalRentalDates } =
    useCartStore();
  const { stock } = useInventoryStore();

  const isSerial = item.product.is_serial;
  const isRent = item.operationType === "alquiler";
  const currentBranchId = USER_MOCK[0].branchId;

  // ----------------------------------------------------------------------
  // 1. LÓGICA DE RECUPERACIÓN DE VARIANTE (CRÍTICO PARA QUE FUNCIONE EL WIDGET)
  // ----------------------------------------------------------------------
  const variantContext = useMemo(() => {
    // A. Si el ítem ya tiene talla/color guardados en el carrito, usamos esos.
    if (item.selectedSize && item.selectedColor) {
      return { size: item.selectedSize, color: item.selectedColor };
    }

    // B. Si es serial y ya seleccionamos IDs (p.ej con escáner), buscamos la variante de ese ID.
    if (item.selectedStockIds.length > 0) {
      const firstStock = stock.find((s) => s.id === item.selectedStockIds[0]);
      if (firstStock) {
        return { size: firstStock.size, color: firstStock.color };
      }
    }

    // C. Fallback Inteligente: Buscamos el primer stock disponible que coincida con el producto.
    // Esto evita pasar "" al widget.
    const candidate = stock.find(
      (s) =>
        s.productId === item.product.id &&
        s.status === "disponible" &&
        (isRent ? s.isForRent : s.isForSale),
    );

    return {
      size: candidate?.size || "",
      color: candidate?.color || "",
    };
  }, [item, stock, isRent]);

  // ----------------------------------------------------------------------
  // 2. LÓGICA DE FECHAS (CRÍTICO PARA EL FILTRO DEL WIDGET)
  // ----------------------------------------------------------------------
  const validDateRange = useMemo(() => {
    // Si hay fechas globales (alquiler), las usamos.
    if (globalRentalDates) return globalRentalDates;

    // Si es venta o no hay fechas, creamos un rango "Hoy -> Hoy" para que el filtro pase.
    const today = new Date();
    return { from: today, to: addDays(today, 1) };
  }, [globalRentalDates]);

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return;
    updateQuantity(item.cartId, newQty);
  };

  // Validamos si faltan asignaciones
  const missingAssignments =
    isSerial && item.selectedStockIds.length !== item.quantity;
  // Derivar size/color: prioridad → campos del CartItem → primer stock asignado → primer disponible
  const stockHint = useMemo(() => {
    // 1. Si el CartItem ya tiene variante seleccionada, usarla directamente
    if (item.selectedSize && item.selectedColor) {
      return { size: item.selectedSize, color: item.selectedColor };
    }
    // 2. Si ya tiene stock IDs asignados, usamos el primero para sacar size/color
    if (item.selectedStockIds.length > 0) {
      const firstAssigned = stock.find(
        (s) => s.id === item.selectedStockIds[0],
      );
      if (firstAssigned)
        return { size: firstAssigned.size, color: firstAssigned.color };
    }
    // 3. Fallback: primer stock disponible del producto
    const firstAvailable = stock.find(
      (s) =>
        s.productId === item.product.id &&
        s.status === "disponible" &&
        (isRent ? s.isForRent : s.isForSale),
    );
    return {
      size: firstAvailable?.size ?? "",
      color: firstAvailable?.color ?? "",
    };
  }, [
    stock,
    item.product.id,
    item.selectedStockIds,
    item.selectedSize,
    item.selectedColor,
    isRent,
  ]);

  // Fecha de rango (global del carrito o fallback hoy+3)
  const dateRange = useMemo(() => {
    if (globalRentalDates) return globalRentalDates;
    return { from: new Date(), to: addDays(new Date(), 3) };
  }, [globalRentalDates]);

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg shadow-sm hover:border-slate-900 transition-colors group">
      {/* 1. Header del Item: Nombre y Borrar */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col">
          <span className="font-bold text-xs line-clamp-2 leading-tight">
            {item.product.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {item.product.category}
          </span>
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

      {/* 2. Controles de Operación y Cantidad */}
      <div className="flex items-end justify-between mt-1">
        <div className="flex flex-col gap-1.5">
          {/* Badge de Tipo */}
          <Badge
            variant={isRent ? "default" : "secondary"}
            className={`text-[9px] px-1.5 h-4 w-fit ${isRent ? "bg-blue-400" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
          >
            {isRent ? "ALQUILER" : "VENTA"}
          </Badge>

          {/* CONTROLES DINÁMICOS */}
          {isSerial ? (
            /* CASO SERIAL: Botón de Asignación con Widget Real */
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-7 text-[10px] px-2 border-dashed ${
                    item.selectedStockIds.length !== item.quantity
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-emerald-300 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <Barcode className="w-3 h-3 mr-1" />
                  {item.selectedStockIds.length} / {item.quantity} Asignados
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" side="right">
                <StockAssignmentWidget
                  productId={item.product.id}
                  // Pasamos la variante calculada (evita vacíos)
                  size={variantContext.size}
                  color={variantContext.color}
                  quantity={item.quantity}
                  operationType={item.operationType}
                  dateRange={validDateRange}
                  currentBranchId={currentBranchId}
                  // Configuraciones para POS
                  isSerial={true}
                  isImmediate={true} // El POS suele ser entrega inmediata
                  initialSelections={item.selectedStockIds} // Estado actual
                  onAssignmentChange={(ids) =>
                    updateSelectedStock(item.cartId, ids)
                  }
                />
              </PopoverContent>
            </Popover>
          ) : (
            /* CASO LOTE: Stepper Numérico */
            <div className="flex items-center border rounded-md h-7 w-fit">
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-6 rounded-none hover:bg-slate-200"
                onClick={() => handleQuantityChange(item.quantity - 1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <div className="w-8 text-center text-xs font-bold tabular-nums">
                {item.quantity}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-6 rounded-none hover:bg-slate-200"
                onClick={() => handleQuantityChange(item.quantity + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* 3. Subtotal */}
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">
            {formatCurrency(item.unitPrice)} c/u
          </div>
          <div className="text-sm font-black text-slate-500">
            {formatCurrency(item.subtotal)}
          </div>
        </div>
      </div>
    </div>
  );
}

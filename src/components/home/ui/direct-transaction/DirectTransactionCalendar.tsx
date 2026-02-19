// src/components/direct-transaction/DirectTransactionCalendar.tsx
import {
  format,
  addDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getReservationDataByAttributes,
  OpType,
  getTotalStock,
} from "@/src/utils/reservation/checkAvailability";
import { useMemo } from "react";
import { CartItem } from "@/src/types/cart/type.cart";

interface DirectCalendarProps {
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  mode: "pickup" | "return"; // pickup: restringido a 3 días, return: libre a futuro
  minDate?: Date; // Para la devolución, la fecha mínima es el día de recojo
  label?: string;
  type?: OpType;
  maxDays?: number;
  productId?: string;
  sizeId?: string;
  colorId?: string;
  quantity?: number;
  cartItems?: CartItem[]; // 👈 Nuevo: Para validación colectiva en el POS
}

export function DirectTransactionCalendar({
  triggerRef,
  type = "alquiler",
  selectedDate,
  onSelect,
  mode,
  minDate,
  label = "Seleccionar fecha",
  maxDays,
  productId,
  sizeId,
  colorId,
  quantity,
  cartItems,
}: DirectCalendarProps) {
  const today = new Date();

  // 1. OBTENER DATOS DE DISPONIBILIDAD (Para uno o varios productos)
  const availabilityData = useMemo(() => {
    // Caso A: Usamos el carrito (POS)
    if (cartItems && cartItems.length > 0) {
      return cartItems.map((item) => ({
        id: item.product.id,
        quantity: item.quantity,
        data: getReservationDataByAttributes(
          item.product.id,
          item.selectedSizeId || "",
          item.selectedColorId || "",
          type,
        ),
      }));
    }

    // Caso B: Un solo producto (DirectTransactionModal)
    if (productId && sizeId && colorId) {
      return [
        {
          id: productId,
          quantity: quantity || 1,
          data: getReservationDataByAttributes(
            productId,
            sizeId,
            colorId,
            type,
          ),
        },
      ];
    }

    return [];
  }, [productId, sizeId, colorId, type, cartItems, quantity]);

  // 2. FUNCIÓN PARA SABER SI UN DÍA ESTÁ LLENO (Basado en la colección de disponibilidad)
  const isDayFull = (date: Date) => {
    if (availabilityData.length === 0) return false;

    // Un día está lleno si AL MENOS UN producto del set no cabe
    return availabilityData.some(({ quantity: requestedQty, data }) => {
      const { totalPhysicalStock, activeReservations } = data;

      if (totalPhysicalStock === 0) return true;

      const reservedAtThisTime = activeReservations
        .filter((r) => isWithinInterval(date, { start: r.start, end: r.end }))
        .reduce((sum, r) => sum + (r.quantity || 1), 0);

      return reservedAtThisTime + requestedQty > totalPhysicalStock;
    });
  };

  // 3. REGLA DE PICKUP (Apartado Físico: Máximo 2 días)
  const maxPickupDate = addDays(today, maxDays || 2);

  // 4. LÓGICA FINAL DE BLOQUEO
  const isDisabled = (date: Date) => {
    const day = startOfDay(date);

    // A. Bloqueo por Reglas de Negocio (Tiempos)
    let isRestrictedByRules = false;

    if (mode === "pickup") {
      isRestrictedByRules =
        day < startOfDay(today) || day > endOfDay(maxPickupDate);
    } else {
      const referenceDate = minDate ? startOfDay(minDate) : startOfDay(today);
      isRestrictedByRules = day < referenceDate;
    }

    // B. Bloqueo por Disponibilidad (Stock agotado en el conjunto de productos)
    const isRestrictedByStock = !isRestrictedByRules && isDayFull(day);

    return isRestrictedByRules || isRestrictedByStock;
  };

  return (
    <div className="space-y-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10 border-dashed",
              !selectedDate && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            {selectedDate ? (
              format(selectedDate, "PPP", { locale: es })
            ) : (
              <span>{label}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelect}
            disabled={isDisabled}
            autoFocus
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

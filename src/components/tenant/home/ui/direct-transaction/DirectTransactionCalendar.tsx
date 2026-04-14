// src/components/direct-transaction/DirectTransactionCalendar.tsx
import {
  format,
  addDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Info } from "lucide-react";
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
} from "@/src/utils/reservation/checkAvailability";
import { useMemo } from "react";
import { CartItem } from "@/src/types/cart/type.cart";

interface DirectCalendarProps {
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  mode: "pickup" | "return"; 
  minDate?: Date; 
  label?: string;
  type?: OpType;
  maxDays?: number;
  productId?: string;
  variantId?: string;
  quantity?: number;
  cartItems?: CartItem[]; 
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
  variantId,
  quantity,
  cartItems,
}: DirectCalendarProps) {
  const today = new Date();

  // 1. OBTENER DATOS DE DISPONIBILIDAD DINÁMICA
  // El 'totalPhysicalStock' aquí ya viene filtrado sin los ítems en lavandería/mantenimiento
  const availabilityData = useMemo(() => {
    if (cartItems && cartItems.length > 0) {
      return cartItems.map((item) => ({
        id: item.product.id,
        quantity: item.quantity,
        data: getReservationDataByAttributes(item.product.id, item.variantId || "", type),
      }));
    }

    if (productId && variantId) {
      return [{
        id: productId,
        quantity: quantity || 1,
        data: getReservationDataByAttributes(productId, variantId, type),
      }];
    }
    return [];
  }, [productId, variantId, type, cartItems, quantity]);

  // 2. CÁLCULO DE DISPONIBILIDAD (Sin buffers estáticos)
  const isDayFull = (date: Date) => {
    if (availabilityData.length === 0) return false;

    return availabilityData.some(({ quantity: requestedQty, data }) => {
      const { totalPhysicalStock, activeReservations } = data;

      // Si el stock físico es 0 (ej: todos en mantenimiento), el día está bloqueado
      if (totalPhysicalStock === 0) return true;

      const reservedAtThisTime = activeReservations
        .filter((r) => isWithinInterval(date, { start: r.start, end: r.end }))
        .reduce((sum, r) => sum + (r.quantity || 1), 0);

      // Bloquea si las reservas futuras + el pedido actual superan el stock "hábil"
      return reservedAtThisTime + requestedQty > totalPhysicalStock;
    });
  };

  // 3. LÓGICA DE BLOQUEO DE CALENDARIO
  const isDisabled = (date: Date) => {
    const day = startOfDay(date);

    // A. Reglas Temporales
    if (mode === "pickup") {
      if (day < startOfDay(today)) return true; // Solo prevenir fechas pasadas
    } else {
      const referenceDate = minDate ? startOfDay(minDate) : startOfDay(today);
      if (day < referenceDate) return true;
    }

    // B. Disponibilidad Física (Basada en el Pool Real)
    return isDayFull(day);
  };

  return (
    <div className="space-y-2">
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

      {/* 4. INDICADOR DE STOCK REAL (Opcional: ayuda al vendedor a entender por qué hay bloqueos) */}
      {mode === "pickup" && availabilityData.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md">
          <Info className="w-3 h-3 text-amber-500" />
          <span>
            Stock físico disponible hoy: {availabilityData[0].data.totalPhysicalStock} unidades.
          </span>
        </div>
      )}
    </div>
  );
}
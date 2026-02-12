// src/components/direct-transaction/DirectTransactionCalendar.tsx
import { format, addDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
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
import { getReservationDataByAttributes } from "@/src/utils/reservation/checkAvailability";
import { useMemo } from "react";

interface DirectCalendarProps {
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  mode: "pickup" | "return"; // pickup: restringido a 3 días, return: libre a futuro
  minDate?: Date; // Para la devolución, la fecha mínima es el día de recojo
  label?: string;
  type?: string;
  maxDays?: number;
  productId: string;
  size: string;
  color: string;
  quantity?: number;
}

export function DirectTransactionCalendar({
  triggerRef,
  selectedDate,
  onSelect,
  mode,
  minDate,
  label = "Seleccionar fecha",
  maxDays,
  productId,
  size,
  color,
  quantity,
}: DirectCalendarProps) {
  const today = new Date();

    const availabilityData = useMemo(() => {
      if (!productId || !size || !color) {
        return { totalPhysicalStock: 0, activeReservations: [] };
      }
      return getReservationDataByAttributes(productId, size, color);
    }, [productId, size, color]);
  
    const { totalPhysicalStock, activeReservations } = availabilityData;

  // 2. FUNCIÓN PARA SABER SI UN DÍA ESTÁ LLENO
  const isDayFull = (date: Date) => {
    // Si no hay stock físico, bloqueamos todo
    if (totalPhysicalStock === 0) return true;

    // Sumar cuántos ya están ocupados en esa fecha
    const reservedCount = activeReservations
      .filter((r) => isWithinInterval(date, { start: r.start, end: r.end }))
      .reduce((sum, r) => sum + (r.quantity || 1), 0);

    // Sumar los que yo quiero llevarme
     const currentRequest = quantity || 1;
    // Si la suma supera el total físico -> BLOQUEADO
    return (reservedCount + currentRequest) > totalPhysicalStock;
  };

  // 3. REGLA DE PICKUP (Apartado Físico: Máximo 2 días)
  const maxPickupDate = addDays(today, maxDays || 2);

  // 4. LÓGICA FINAL DE BLOQUEO
  const isDisabled = (date: Date) => {
    const day = startOfDay(date);
    
    // A. Bloqueo por Reglas de Negocio (Tiempos)
    let isRestrictedByRules = false;
    
    if (mode === "pickup") {
      // Solo permite hoy, mañana y pasado mañana
      isRestrictedByRules = day < startOfDay(today) || day > endOfDay(maxPickupDate);
    } else {
      // Para devolución: Solo permite fechas posteriores a la de recojo
      const referenceDate = minDate ? startOfDay(minDate) : startOfDay(today);
      isRestrictedByRules = day < referenceDate;
    }

    // B. Bloqueo por Disponibilidad (Stock agotado ese día)
    // Solo validamos ocupación si NO está ya bloqueado por reglas de fecha
    // y si es Alquiler (o si quieres validar venta también)
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
              !selectedDate && "text-muted-foreground"
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
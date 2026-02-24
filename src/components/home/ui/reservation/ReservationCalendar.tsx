import { format, addDays, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/src/hooks/use-mobile";
// Asegúrate de importar tu helper actualizado
import { getReservationDataByAttributes } from "@/src/utils/reservation/checkAvailability";
import { useMemo } from "react";

export function ReservationCalendar({
  triggerRef,
  mode,
  originBranchId,
  currentBranchId,
  rules,
  dateRange,
  setDateRange,
  productId,
  sizeId,
  colorId,
  type,
  quantity,
  quantityDesired,
}: any) {
  
  // 1. Obtener datos unificados (Reservas + Alquileres + Lavandería)
  const availabilityData = useMemo(() => {
    if (!productId || !sizeId || !colorId) {
      return { totalPhysicalStock: 0, activeReservations: [] };
    }
    return getReservationDataByAttributes(productId, sizeId, colorId, type);
  }, [productId, sizeId, colorId, type]);

  // 2. CORRECCIÓN CLAVE:
  // Renombramos 'activeReservations' a 'occupiedIntervals' para que tenga sentido semántico
  // y coincida con tu lógica de abajo.
  const { totalPhysicalStock, activeReservations: occupiedIntervals } = availabilityData;

  const isDayFull = (date: Date) => {
    // Si no hay stock físico en el mundo, bloqueamos
    if (totalPhysicalStock === 0) return true;

    // A. Sumar ocupación existente en esa fecha
    // (occupiedIntervals ya incluye: Reservas Futuras, Alquileres Activos y Lavandería)
    const reservedCount = occupiedIntervals
      .filter((r: any) => isWithinInterval(date, { start: r.start, end: r.end }))
      .reduce((sum: number, r: any) => sum + (r.quantity || 1), 0);

    // B. Sumar lo que YO quiero llevarme ahora
    const currentRequest = quantity ?? quantityDesired ?? 1; 

    // C. Comparar con el total físico
    return (reservedCount + currentRequest) > totalPhysicalStock;
  };

  const isLocal = originBranchId === currentBranchId;
  const transferDays = isLocal
    ? 0
    : getEstimatedTransferTime(originBranchId, currentBranchId, rules);

  const minAvailableDate = addDays(new Date(), isLocal ? 0 : transferDays + 1);
  minAvailableDate.setHours(0, 0, 0, 0);

  const isMobile = useIsMobile();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          className={cn(
            "focus:outline-none",
            triggerRef
              ? "absolute inset-0 w-full h-full opacity-0 z-0 cursor-default"
              : "flex w-full items-center justify-start border p-2 rounded-md",
          )}
        >
          {!triggerRef && <CalendarIcon className="mr-2 h-4 w-4" />}
          {!triggerRef && "Seleccionar fecha"}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="center"
        side="bottom"
        sideOffset={5}
      >
        <Calendar
          mode={mode as any}
          locale={es}
          defaultMonth={mode === "single" ? dateRange?.from || minAvailableDate : dateRange?.from || minAvailableDate}
          selected={mode === "single" ? dateRange?.from : dateRange}
          onSelect={(val: any) => {
            if (mode === "single") {
              setDateRange(val ? { from: val, to: val } : undefined);
            } else {
              setDateRange(val);
            }
          }}
          numberOfMonths={mode === "range" && !isMobile ? 2 : 1}
          // APLICAMOS EL BLOQUEO
          disabled={(date) => date < minAvailableDate || isDayFull(date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

import { format, addDays, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, InfoIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { BusinessRules } from "@/src/types/bussines-rules/bussines-rules";
import type { DateRange } from "react-day-picker";
import { getReservationDataByAttributes } from "@/src/utils/reservation/checkAvailability";
import { useMemo } from "react";

// ... dentro de tu lógica de reserva o un nuevo componente ...

export function ReservationCalendar({
  triggerRef,
  mode,
  originBranchId,
  currentBranchId,
  rules,
  dateRange,
  setDateRange,
  productId,
  size,
  color,
}: any) {
  const availabilityData = useMemo(() => {
    if (!productId || !size || !color) {
      return { totalPhysicalStock: 0, activeReservations: [] };
    }
    return getReservationDataByAttributes(productId, size, color);
  }, [productId, size, color]);

  const { totalPhysicalStock, activeReservations } = availabilityData;

  const isDayFull = (date: Date) => {
    if (totalPhysicalStock === 0) return false; // Si no hay stock físico, no bloqueamos calendario por reservas, sino por stock 0 global (que deberías validar fuera)

    const reservationsThatDay = activeReservations.filter((range) =>
      isWithinInterval(date, { start: range.start, end: range.end }),
    ).length;
    return reservationsThatDay >= totalPhysicalStock;
  };

  const isLocal = originBranchId === currentBranchId;
  const transferDays = isLocal
    ? 0
    : getEstimatedTransferTime(originBranchId, currentBranchId, rules);

  // Usamos startOfDay para evitar problemas con horas
  const minAvailableDate = addDays(new Date(), isLocal ? 0 : transferDays + 1);
  minAvailableDate.setHours(0, 0, 0, 0);

  const isMobile = useIsMobile();
  // --- EL RENDERIZADO AHORA ES MINIMALISTA ---
  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* ESTA ES LA CLAVE: 
            Si existe triggerRef, el botón debe ser un área invisible 
            que cubra exactamente el contenedor relativo de afuera.
        */}
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
          {/* Solo mostramos iconos/texto si NO es el modo compacto */}
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
          defaultMonth={minAvailableDate}
          selected={mode === "single" ? dateRange?.from : dateRange}
          onSelect={(val: any) => {
            if (mode === "single") {
              setDateRange(val ? { from: val, to: val } : undefined);
            } else {
              setDateRange(val);
            }
          }}
          numberOfMonths={mode === "range" && !isMobile ? 2 : 1}
          disabled={(date) => date < minAvailableDate || isDayFull(date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

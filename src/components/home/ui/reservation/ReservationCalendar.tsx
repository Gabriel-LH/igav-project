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
import { getAvailabilityByAttributes } from "@/src/utils/reservation/checkAvailability";
import { useMemo } from "react";

// ... dentro de tu lógica de reserva o un nuevo componente ...

export function ReservationCalendar({
  mode,
  originBranchId,
  currentBranchId,
  rules,
  dateRange,
  setDateRange,
  productId,
  size,
  color,
}: {
  mode: "single" | "range";
  originBranchId: string;
  currentBranchId: string;
  rules: BusinessRules | any;
  dateRange: DateRange | undefined;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  productId: string;
  size: string;
  color: string;
}) {
  const { totalPhysicalStock, activeReservations } = useMemo(
    () => getAvailabilityByAttributes(productId, size, color),
    [productId, size, color],
  );

  const isDayFull = (date: Date) => {
    // Contamos cuántas reservas hay activas en este día específico
    const reservationsThatDay = activeReservations.filter((range) =>
      isWithinInterval(date, { start: range.start, end: range.end }),
    ).length;

    // Si las reservas ocupan todo el stock físico, bloqueamos el día
    return reservationsThatDay >= totalPhysicalStock;
  };
  const isLocal = originBranchId === currentBranchId;

  const transferDays = isLocal
    ? 0
    : getEstimatedTransferTime(originBranchId, currentBranchId, rules);

  const minAvailableDate = addDays(new Date(), isLocal ? 0 : transferDays + 1);

  const isMobile = useIsMobile();

  // --- Función para mostrar la fecha en el botón ---
  const formatButtonDate = () => {
    if (!dateRange?.from) return "Seleccionar fecha/rango";

    if (mode === "single") {
      // Solo mostramos la fecha "from"
      return format(dateRange.from, "dd 'de' LLLL 'de' y", { locale: es });
    }

    // Rango
    if (dateRange.to) {
      return `${format(dateRange.from, "dd 'de' LLLL 'de' y", { locale: es })} - ${format(dateRange.to, "dd 'de' LLLL 'de' y", { locale: es })}`;
    }

    return format(dateRange.from, "dd 'de' LLLL 'de' y", { locale: es });
  };

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal -mt-2 h-12",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatButtonDate()}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="center">
          {mode === "single" ? (
            <Calendar
              mode="single"
              locale={es}
              defaultMonth={minAvailableDate}
              selected={dateRange?.from}
              onSelect={(date) =>
                setDateRange(date ? { from: date, to: date } : undefined)
              }
              numberOfMonths={1}
              disabled={(date) => date < minAvailableDate}
            />
          ) : (
            <Calendar
              mode="range"
              locale={es}
              defaultMonth={minAvailableDate}
              selected={dateRange}
              onSelect={(range) => setDateRange(range)}
              numberOfMonths={isMobile ? 1 : 2}
              required={true} // <--- IMPORTANTE para PropsRangeRequired
              disabled={(date) => {
                const isPast = date < minAvailableDate;
                if (isPast) return true;

                return isDayFull(date);
              }}
            />
          )}
        </PopoverContent>
      </Popover>

      {originBranchId !== currentBranchId && (
        <div className="bg-blue-50 p-3 rounded-lg flex gap-2 items-start">
          <InfoIcon className="w-4 h-4 text-blue-600 mt-0.5" />
          <p className="text-[11px] text-blue-700 leading-tight">
            Este artículo requiere traslado desde otra sede. La fecha más
            próxima de entrega es el{" "}
            <strong>{format(minAvailableDate, "dd/MM/yyyy")}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

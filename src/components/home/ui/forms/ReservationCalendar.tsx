import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, InfoIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React, { useState } from "react";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/label";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { BusinessRules } from "@/src/types/bussines-rules/bussines-rules";
import type { DateRange } from "react-day-picker";

// ... dentro de tu lógica de reserva o un nuevo componente ...

export function ReservationCalendar({
  originBranchId,
  currentBranchId,
  rules,
  dateRange,
  setDateRange,
}: {
  originBranchId: string;
  currentBranchId: string;
  rules: BusinessRules;
  dateRange: DateRange | undefined;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}) {
  // Calculamos la fecha mínima permitida
  const isLocal = originBranchId === currentBranchId;

  const transferDays = isLocal
    ? 0
    : getEstimatedTransferTime(originBranchId, currentBranchId, rules);

  const minAvailableDate = addDays(new Date(), isLocal ? 0 : transferDays + 1);

  const isMobile = useIsMobile();

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-muted/20">
      <Label className="text-xs uppercase font-bold text-muted-foreground">
        Selecciona las fechas del evento
      </Label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-12",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd 'de' LLLL 'de' y", {
                    locale: es,
                  })}{" "}
                  -{" "}
                  {format(dateRange.to, "dd 'de' LLLL 'de' y", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd 'de' LLLL 'de' y", { locale: es })
              )
            ) : (
              <span>Seleccionar rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="range"
            locale={es}
            defaultMonth={minAvailableDate}
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={isMobile ? 1 : 2}
            // AQUÍ LA LÓGICA DE BLOQUEO:
            disabled={(date) => date < minAvailableDate || date < new Date()}
          />
        </PopoverContent>
      </Popover>

      {/* Info de logística si es remoto */}
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

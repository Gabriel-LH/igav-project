// src/components/direct-transaction/DirectTransactionCalendar.tsx
import { format, addDays, startOfDay, endOfDay } from "date-fns";
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

interface DirectCalendarProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  mode: "pickup" | "return"; // pickup: restringido a 3 días, return: libre a futuro
  minDate?: Date; // Para la devolución, la fecha mínima es el día de recojo
  label?: string;
}

export function DirectTransactionCalendar({
  selectedDate,
  onSelect,
  mode,
  minDate,
  label = "Seleccionar fecha",
}: DirectCalendarProps) {
  const today = new Date();
  
  // Regla de negocio: Máximo 2 días adicionales para "Apartado Físico"
  const maxPickupDate = addDays(today, 2);

  const isDisabled = (date: Date) => {
    const day = startOfDay(date);
    
    if (mode === "pickup") {
      // Solo permite hoy, mañana y pasado mañana
      return day < startOfDay(today) || day > endOfDay(maxPickupDate);
    } else {
      // Para devolución: Solo permite fechas posteriores a la de recojo (minDate)
      const referenceDate = minDate ? startOfDay(minDate) : startOfDay(today);
      return day < referenceDate;
    }
  };

  return (
    <div className="space-y-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
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
            initialFocus
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
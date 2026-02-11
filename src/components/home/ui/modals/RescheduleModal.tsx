import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarAdd01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { ReservationCalendar } from "../reservation/ReservationCalendar";
import { DialogDescription } from "@radix-ui/react-dialog";
import { TimePicker } from "../direct-transaction/TimePicker";

export function RescheduleModal({
  open,
  operationType,
  onOpenChange,
  onConfirm,
  currentStartDate,
  currentEndDate,
  branchId,
}: any) {
  // Inicializamos el rango con las fechas actuales de la reserva
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: currentStartDate,
    to: currentEndDate,
  });

  const [pickupHour, setPickupHour] = useState("10:00");

  console.log("Hora que se establece", pickupHour);

  const handleConfirm = () => {
    if (dateRange?.from && dateRange?.to) {
      // Pasamos las nuevas fechas al store
      onConfirm(dateRange.from, dateRange.to, pickupHour);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <HugeiconsIcon icon={CalendarAdd01Icon} size={24} />
            <DialogTitle>Reagendar Periodo de Reserva</DialogTitle>
          </div>
          <DialogDescription className="text-xs pt-3">
            Seleccionar Nuevo Periodo (Retiro - Devolución)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* CALENDARIO EN MODO RANGO */}
          <Label className="text-xs uppercase font-bold ">
            <HugeiconsIcon icon={CalendarAdd01Icon} size={14} strokeWidth={2} />
            Selecciona las fechas
          </Label>
          <ReservationCalendar
            mode={operationType === "alquiler" ? "range" : "single"}
            originBranchId={branchId}
            currentBranchId={branchId}
            rules={{}} // Pasa tus reglas de negocio aquí
            dateRange={dateRange}
            setDateRange={setDateRange}
            productId={""}
            size={""}
            color={""}
          />
          {/* SELECTOR DE HORA (Input simple pero funcional) */}
          <div className="space-y-2">
            {dateRange?.from && (
              <TimePicker
                label="Hora de retiro sugerida"
                value={pickupHour}
                onChange={setPickupHour}
              />
            )}
          </div>

          {/* RESUMEN VISUAL EN ESPAÑOL */}
          {dateRange?.from && dateRange?.to && operationType === "alquiler" && (
            <div className="flex justify-between items-center px-2 py-1 rounded-lg bg-muted/20 border border-muted">
              <span className="uppercase text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                La reserva se moverá al periodo del: <br />
                <strong className="text-sm">
                  {format(dateRange.from, "PPP", { locale: es })}
                </strong>
              </span>
              <span className="uppercase text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                hasta el: <br />
                <strong className="text-sm">
                  {format(dateRange.to, "PPP", { locale: es })}
                </strong>
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            onClick={handleConfirm}
            disabled={!dateRange?.to}
          >
            Confirmar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

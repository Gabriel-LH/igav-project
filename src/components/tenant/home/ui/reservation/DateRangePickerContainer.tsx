import { CalendarIcon, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/label";

export interface DateRangePickerContainerProps {
  label: string;
  fromDate: Date | null;
  toDate: Date | null;
  fromTime: string | null;
  toTime: string | null;
  onDateClick: () => void;
  onFromTimeClick: () => void;
  onToTimeClick: () => void;
}

export const DateRangePickerContainer = ({
  label,
  fromDate,
  toDate,
  fromTime,
  toTime,
  onDateClick,
  onFromTimeClick,
  onToTimeClick,
}: DateRangePickerContainerProps ) => (
  <div className="flex flex-col gap-1.5 w-full relative">
    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
      {label}
    </Label>

    <div className="flex justify-between items-center gap-1 p-1 rounded-lg border border-input bg-background relative">
      {/* SECCIÓN INICIO */}
      <div className="flex gap-1">
        {/* Botón Fecha Inicio */}
        <div
          className="relative flex items-center gap-2 p-1.5 hover:bg-accent rounded cursor-pointer transition-colors"
          onClick={onDateClick}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-bold truncate">
            {fromDate ? format(fromDate, "dd/MM/yy") : "Inicio"}
          </span>
        </div>
        {/* Botón Hora Inicio */}
        <div className=" h-5 mt-1 border border-neutral-700 " />
        <div
          className="relative flex items-center gap-2 p-1.5 hover:bg-accent rounded cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onFromTimeClick();
          }}
        >
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">{fromTime || "--:--"}</span>
        </div>
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground" />

      {/* SECCIÓN FIN */}
      <div className="flex gap-1">
        {/* Botón Fecha Fin */}
        <div
          className="relative flex items-center gap-2 p-1.5 hover:bg-accent rounded cursor-pointer transition-colors"
          onClick={onDateClick}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-bold truncate">
            {toDate ? format(toDate, "dd/MM/yy") : "Fin"}
          </span>
        </div>
        {/* Botón Hora Fin */}
        <div className=" h-5 mt-1 border border-neutral-700 " />
        <div
          className="relative flex items-center gap-2 p-1.5 hover:bg-accent rounded cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToTimeClick();
          }}
        >
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">{toTime || "--:--"}</span>
        </div>
      </div>
    </div>
  </div>
);

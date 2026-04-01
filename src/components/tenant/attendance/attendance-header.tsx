import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { es } from "date-fns/locale";

export function AttendanceHeader() {
  const weekStart = new Date();
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <CalendarIcon className="w-6 h-6" />
        Control de Asistencia
      </h1>
      <p className="text-muted-foreground text-sm">
        Semana del {format(weekStart, "d 'de' MMMM", { locale: es })}
      </p>
    </div>
  );
}

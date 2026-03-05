import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import {
  getAllowedHours,
  getAllowedMinutes,
  isHourAllowed,
  to12Hour,
  to24Hour,
} from "@/src/utils/times/businessTime";

type Period = "AM" | "PM";

type TimePicker12hProps = {
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  label?: string;
};

export function TimePicker({
  triggerRef,
  value,
  onChange,
  label,
}: TimePicker12hProps) {
  const [hour24Current, minuteCurrent] = value.split(":").map(Number);

  // recalcula dinámicamente
  const { hour12, period } = to12Hour(hour24Current);

  const allowedHours = getAllowedHours(period); // horas permitidas para este período
  const allowedMinutes = getAllowedMinutes(hour24Current);

  const setHour = (h12: number) => {
    const h24 = to24Hour(h12, period);
    if (!isHourAllowed(h24)) return;

    // OBTENER MINUTOS VÁLIDOS PARA LA NUEVA HORA
    const validMinutesForNewHour = getAllowedMinutes(h24);
    const currentMinStr = minuteCurrent.toString().padStart(2, "0");

    // Si el minuto actual no es válido para la hora elegida, usa el primero disponible
    const finalMinute = validMinutesForNewHour.includes(currentMinStr)
      ? currentMinStr
      : validMinutesForNewHour[0];

    onChange(`${h24.toString().padStart(2, "0")}:${finalMinute}`);
  };

  const setMinute = (m: string) => {
    onChange(`${hour24Current.toString().padStart(2, "0")}:${m}`);
  };

  const setPeriod = (p: Period) => {
    const newHour24 = to24Hour(hour12, p);

    // Verificamos minutos para el nuevo periodo/hora
    const validMinutesForNewHour = getAllowedMinutes(newHour24);
    const currentMinStr = minuteCurrent.toString().padStart(2, "0");

    const finalMinute = validMinutesForNewHour.includes(currentMinStr)
      ? currentMinStr
      : validMinutesForNewHour[0];

    onChange(`${newHour24.toString().padStart(2, "0")}:${finalMinute}`);
  };

  return (
    <div>
      {label && (
        <Label className="text-[11px] font-bold uppercase">
          <HugeiconsIcon icon={Clock01Icon} size={14} strokeWidth={2} />
          {label}
        </Label>
      )}

      <Popover modal={false} aria-hidden={false}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            tabIndex={-1}
          >
            {hour12.toString().padStart(2, "0")}:
            {minuteCurrent.toString().padStart(2, "0")} {period}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-56 p-2"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-3 gap-2">
            {/* Horas */}
            <div className="max-h-40 overflow-y-auto overscroll-contain">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <Button
                  key={h}
                  disabled={!allowedHours.includes(h)}
                  variant="ghost"
                  className={`w-full justify-center ${h === hour24Current ? "bg-primary text-primary-foreground" : h === hour12 ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setHour(h)}
                >
                  {h.toString().padStart(2, "0")}
                </Button>
              ))}
            </div>

            {/* Minutos */}
            <div className="max-h-40 overflow-y-auto overscroll-contain">
              {allowedMinutes.map((m) => (
                <Button
                  key={m}
                  variant="ghost"
                  className={`w-full justify-center ${Number(m) === minuteCurrent ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setMinute(m)}
                >
                  {m}
                </Button>
              ))}
            </div>

            {/* AM / PM */}
            <div className="flex flex-col gap-2">
              {(["AM", "PM"] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

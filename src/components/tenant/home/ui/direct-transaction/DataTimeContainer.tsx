import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/label";
import { useIsMobile } from "@/src/hooks/use-mobile";

export interface DateTimeContainerProps {
  label: string;
  date: Date | { from?: Date } | undefined;
  time: string;
  onDateClick: () => void;
  onTimeClick: () => void;
  placeholderDate: string;
  placeholderTime: string;
}

export const DateTimeContainer = ({
  label,
  date,
  time,
  onDateClick,
  onTimeClick,
  placeholderDate,
  placeholderTime,
}: DateTimeContainerProps) => {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
        {label}
      </Label>

      <div className="flex items-center h-10 w-full rounded-md border border-input bg-background px-1 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground p-1 rounded transition-colors flex-1"
          onClick={onDateClick}
        >
          {!isMobile ? (
            <CalendarIcon className="h-4 w-4 text-primary" />
          ) : (
            <> </>
          )}
          <span className="truncate">
            {date instanceof Date ? (
              format(date, "dd/MM/yy")
            ) : date?.from ? ( // Si accidentalmente pasas el objeto del rango
              format(date.from, "dd/MM/yy")
            ) : (
              <span className="text-muted-foreground">{placeholderDate}</span>
            )}
          </span>
        </div>

        <div className=" h-5  border border-neutral-700 mx-2 " />

        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground p-1 rounded transition-colors flex-1"
          onClick={onTimeClick}
        >
          {!isMobile ? <Clock className="h-4 w-4 text-primary" /> : <> </>}
          <span className="truncate">
            {time ? (
              time
            ) : (
              <span className="text-muted-foreground">{placeholderTime}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

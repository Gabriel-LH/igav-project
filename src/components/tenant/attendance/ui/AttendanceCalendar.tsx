// components/attendance/AttendanceCalendar.tsx
"use client";

import { useState, useMemo } from "react";
import { useBranchStore } from "@/src/store/useBranchStore";
import { useUserStore } from "@/src/store/useUserStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  MapPin,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  ScanLine,
  AlertCircle,
  Zap,
  CheckCircle2,
  XCircle,
  Minus,
  Edit3,
  FileText,
  Clock,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { DniScanner } from "./DniScanner";
import { AttendanceRecord, MarkAttendanceModal } from "./MarkAttendanceModal";

const SHIFT_CONFIG = {
  morning: { label: "Mañana", start: "08:00", end: "17:00", icon: Clock },
  afternoon: { label: "Tarde", start: "14:00", end: "23:00", icon: Clock },
  night: { label: "Noche", start: "22:00", end: "06:00", icon: Clock },
  custom: { label: "Personalizado", start: "09:00", end: "18:00", icon: Edit3 },
};

const STATUS_CONFIG = {
  present: {
    label: "Presente",
    color: "bg-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
    icon: CheckCircle2,
  },
  late: {
    label: "Tarde",
    color: "bg-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    icon: AlertCircle,
  },
  absent: {
    label: "Ausente",
    color: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: XCircle,
  },
  dayoff: {
    label: "Libre",
    color: "bg-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-600",
    icon: Minus,
  },
  manual: {
    label: "Manual",
    color: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: Edit3,
  },
  justified: {
    label: "Justificado",
    color: "bg-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
    icon: FileText,
  },
};

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];

// Generar registros mock actualizados
const generateMockRecords = (weekStart: Date): AttendanceRecord[] => {
  return [];
};

interface AttendanceCalendarProps {
  onMarkAttendance: (data: {
    employeeId: string;
    date: Date;
    checkIn: string;
    checkOut: string;
    shift: string;
    notes?: string;
    status: string;
  }) => void;
  onScanDni: (dni: string) => void;
  onJustifyAbsence?: (data: {
    employeeId: string;
    date: Date;
    justification: string;
  }) => void;
}

export function AttendanceCalendar({
  onMarkAttendance,
  onJustifyAbsence,
}: AttendanceCalendarProps) {
  const { branches } = useBranchStore();
  const { users: employeesFromStore } = useUserStore();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const branchesToUse = useMemo(() => branches, [branches]);
  const employeesToUse = useMemo(
    () =>
      employeesFromStore.map((u) => ({
        id: u.id,
        name: u.name || u.email,
        dni: "00000000",
        branchId: "all",
        avatar: "",
        defaultShift: "morning" as const,
      })),
    [employeesFromStore],
  );

  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    employee: any;
    date: Date;
    record?: AttendanceRecord;
  } | null>(null);

  const [scanModalOpen, setScanModalOpen] = useState(false);

  const weekStart = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return start;
  }, [currentWeek]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const allRecords = useMemo(() => generateMockRecords(weekStart), [weekStart]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      if (selectedBranch !== "all" && record.branchId !== selectedBranch)
        return false;
      if (selectedEmployee !== "all" && record.employeeId !== selectedEmployee)
        return false;
      if (selectedStatus !== "all" && record.status !== selectedStatus)
        return false;
      return true;
    });
  }, [allRecords, selectedBranch, selectedEmployee, selectedStatus]);

  const stats = useMemo(() => {
    const byStatus = {
      present: filteredRecords.filter((r) => r.status === "present").length,
      late: filteredRecords.filter((r) => r.status === "late").length,
      absent: filteredRecords.filter((r) => r.status === "absent").length,
      dayoff: filteredRecords.filter((r) => r.status === "dayoff").length,
      manual: filteredRecords.filter((r) => r.status === "manual").length,
      justified: filteredRecords.filter((r) => r.status === "justified").length,
    };
    return byStatus;
  }, [filteredRecords]);

  const handleCellClick = (employee: any, date: Date) => {
    const existing = filteredRecords.find(
      (r) => r.employeeId === employee.id && isSameDay(r.date, date),
    );
    setSelectedCell({ employee, date, record: existing });
    setMarkModalOpen(true);
  };

  const handleScanDni = (dni: string) => {
    const employee = employeesToUse.find((e) => e.dni === dni);
    if (employee) {
      const today = new Date();
      const existing = filteredRecords.find(
        (r) => r.employeeId === employee.id && isSameDay(r.date, today),
      );
      setSelectedCell({ employee, date: today, record: existing });
      setMarkModalOpen(true);
      setScanModalOpen(false);
    } else {
      alert("Empleado no encontrado");
    }
  };

  const employeesToShow = useMemo(() => {
    let filtered = employeesToUse;
    if (selectedBranch !== "all") {
      filtered = filtered.filter((e) => e.branchId === selectedBranch);
    }
    if (selectedEmployee !== "all") {
      filtered = filtered.filter((e) => e.id === selectedEmployee);
    }
    return filtered;
  }, [employeesToUse, selectedBranch, selectedEmployee]);

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-6 gap-3">
        {Object.entries(stats).map(([status, count]) => {
          const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          const Icon = config.icon;

          return (
            <Card
              key={status}
              className={cn("border-l", config.bg.replace("bg-", "border-l-"))}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", config.bg)}>
                  <Icon className={cn("w-4 h-4", config.text)} />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", config.text)}>
                    {count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between w-full">
        {/* Primer grupo: 3 selects en grid */}

        <div className="flex gap-2 md:grid md:grid-cols-3">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-fit">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Todas las sucursales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {branchesToUse.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-fit">
              <User className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Todos los empleados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los empleados</SelectItem>
              {employeesToUse.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:flex md:gap-2 grid grid-cols-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentWeek(new Date())}
              className="font-medium"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Popover open={scanModalOpen} onOpenChange={setScanModalOpen}>
            <PopoverTrigger asChild>
              <Button className="gap-2 w-fit">
                <ScanLine className="w-4 h-4" />
                Escanear DNI
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <DniScanner onScan={handleScanDni} employees={employeesToUse} />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            className="gap-2 w-fit"
            onClick={() => setMarkModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Manual
          </Button>
        </div>
      </div>

      {/* Tabla mejorada con Turno y Extra */}
      <div>
        <ScrollArea className="w-full">
          <div className="min-w-[1000px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[180px] font-semibold">
                    Empleado
                  </TableHead>
                  {weekDays.map((day, idx) => (
                    <TableHead
                      key={idx}
                      className="text-center min-w-[140px] p-2"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold">
                          {WEEK_DAYS[idx]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(day, "d MMM", { locale: es })}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesToShow.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {employee.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {employee.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            DNI: {employee.dni}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {weekDays.map((day, idx) => {
                      const record = filteredRecords.find(
                        (r) =>
                          r.employeeId === employee.id &&
                          isSameDay(r.date, day),
                      );

                      const config = record
                        ? STATUS_CONFIG[record.status]
                        : STATUS_CONFIG.dayoff;
                      const shiftConfig = record
                        ? SHIFT_CONFIG[record.shift]
                        : null;
                      const Icon = config.icon;

                      return (
                        <TableCell
                          key={idx}
                          className="p-1 cursor-pointer"
                          onClick={() => handleCellClick(employee, day)}
                        >
                          <div
                            className={cn(
                              "h-24 rounded-lg border-2 transition-all hover:shadow-md flex flex-col p-2 gap-1",
                              record
                                ? cn(config.bg, "border-transparent")
                                : "bg-gray-700 border-dashed border-gray-500 hover:border-gray-300",
                            )}
                          >
                            {record ? (
                              <>
                                {/* Header: Turno + Estado */}
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 py-0 h-4"
                                  >
                                    {shiftConfig?.label || "N/A"}
                                  </Badge>
                                  <Icon
                                    className={cn("w-3 h-3", config.text)}
                                  />
                                </div>

                                {/* Horarios */}
                                {record.checkIn && record.checkOut ? (
                                  <div className="text-center py-1">
                                    <p
                                      className={cn(
                                        "text-sm font-bold leading-tight",
                                        config.text,
                                      )}
                                    >
                                      {record.checkIn}
                                    </p>
                                    <p
                                      className={cn(
                                        "text-xs leading-tight",
                                        config.text,
                                      )}
                                    >
                                      {record.checkOut}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex items-center justify-center">
                                    <span
                                      className={cn(
                                        "text-xs font-medium",
                                        config.text,
                                      )}
                                    >
                                      {config.label}
                                    </span>
                                  </div>
                                )}

                                {/* Footer: Tardanza + Extra */}
                                <div className="mt-auto flex items-center justify-between text-[10px]">
                                  <div className="flex items-center gap-1">
                                    {record.lateMinutes &&
                                    record.lateMinutes > 0 ? (
                                      <span className="text-yellow-600 font-medium flex items-center gap-0.5">
                                        <AlertCircle className="w-3 h-3" />+
                                        {record.lateMinutes}m
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {record.extraHours ||
                                    record.extraMinutes ? (
                                      <span className="text-orange-600 font-medium flex items-center gap-0.5">
                                        <Zap className="w-3 h-3" />
                                        {record.extraHours}h
                                        {record.extraMinutes}m
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                </div>

                                {/* Indicadores adicionales */}
                                <div className="flex gap-1">
                                  {record.isManual && (
                                    <span className="text-[8px] text-blue-600 uppercase tracking-wider bg-blue-100 px-1 rounded">
                                      M
                                    </span>
                                  )}
                                  {record.justification && (
                                    <span className="text-[8px] text-purple-600 uppercase tracking-wider bg-purple-100 px-1 rounded">
                                      J
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center gap-1">
                                <Plus className="w-5 h-5 text-gray-300" />
                                <span className="text-[10px] text-gray-400">
                                  Agregar
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Leyenda mejorada */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-muted-foreground">Estados:</span>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-full", config.color)} />
                <Icon className={cn("w-3.5 h-3.5", config.text)} />
                <span className="text-muted-foreground text-xs">
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end">
          <span className="font-medium text-muted-foreground">
            Indicadores:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200 flex items-center justify-center text-[8px] text-blue-600 font-bold">
              M
            </div>
            <span className="text-muted-foreground text-xs">Manual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200 flex items-center justify-center text-[8px] text-purple-600 font-bold">
              J
            </div>
            <span className="text-muted-foreground text-xs">Justificado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />
            <span className="text-muted-foreground text-xs">
              Tardanza (min)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-muted-foreground text-xs">Extra (h:m)</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      <MarkAttendanceModal
        isOpen={markModalOpen}
        onClose={() => setMarkModalOpen(false)}
        employee={selectedCell?.employee || null}
        date={selectedCell?.date || new Date()}
        existingRecord={selectedCell?.record}
        onSubmit={(data) => {
          if (selectedCell) {
            onMarkAttendance({
              employeeId: selectedCell.employee.id,
              date: selectedCell.date,
              ...data,
            });
          }
        }}
        onJustify={(justification) => {
          if (selectedCell && onJustifyAbsence) {
            onJustifyAbsence({
              employeeId: selectedCell.employee.id,
              date: selectedCell.date,
              justification,
            });
          }
        }}
      />
    </div>
  );
}

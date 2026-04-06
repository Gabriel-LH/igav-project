// components/attendance/AttendanceCalendar.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  ScanLine,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
  Edit3,
  FileText,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  isSameDay,
  isBefore,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { DniScanner } from "./DniScanner";
import { AttendanceRecord, MarkAttendanceModal } from "./MarkAttendanceModal";
import { toast } from "sonner";
import {
  getWeeklyAttendanceAction,
  scanDniAction,
} from "@/src/app/(tenant)/tenant/actions/attendance.actions";
import { useSessionStore } from "@/src/store/useSessionStore";

const STATUS_CONFIG = {
  present: {
    label: "Presente",
    color: "bg-green-500",
    bg: "bg-green-500/30",
    text: "text-green-500",
    icon: CheckCircle2,
  },
  late: {
    label: "Tardanza",
    color: "bg-yellow-500",
    bg: "bg-yellow-500/30",
    text: "text-yellow-500",
    icon: AlertCircle,
  },
  absent: {
    label: "Falta",
    color: "bg-red-500",
    bg: "bg-red-500/30",
    text: "text-red-700",
    icon: XCircle,
  },
  dayoff: {
    label: "Libre",
    color: "bg-gray-400",
    bg: "bg-gray-500/30",
    text: "text-gray-600",
    icon: Minus,
  },
  manual: {
    label: "Manual",
    color: "bg-blue-500",
    bg: "bg-blue-500/30",
    text: "text-blue-700",
    icon: Edit3,
  },
  justified: {
    label: "Justificado",
    color: "bg-purple-500",
    bg: "bg-purple-500/30",
    text: "text-purple-700",
    icon: FileText,
  },
};

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];

interface AttendanceCalendarProps {
  onMarkAttendance: (data: {
    employeeId: string;
    date: Date;
    checkIn: string;
    checkOut: string;
    shift: string;
    shiftId?: string;
    notes?: string;
    status: string;
    lateMinutes?: number;
    extraMinutes?: number;
  }) => void;
  onScanDni: (dni: string) => void;
  onJustifyAbsence?: (data: {
    employeeId: string;
    date: Date;
    justification: string;
    notes: string;
  }) => void;
}

// Utility to check if a shift is overdue
const checkIsOverdue = (startTime: string) => {
  if (!startTime || typeof startTime !== "string") return false;
  const [h, m] = startTime.split(":").map(Number);
  const scheduledStart = new Date();
  scheduledStart.setHours(h, m, 0, 0);
  const delayMin = (new Date().getTime() - scheduledStart.getTime()) / 60000;
  return delayMin > 60;
};

const formatLateMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

type ShiftAssignment = {
  id: string;
  employeeId: string;
  shiftId: string;
  shift: {
    name: string;
    startTime: string;
    endTime: string;
  };
  startDate: Date;
  endDate: Date | null;
};

export function AttendanceCalendar({
  onMarkAttendance,
  onScanDni: _onScanDni,
  onJustifyAbsence,
}: AttendanceCalendarProps) {
  void _onScanDni;
  const { branches } = useBranchStore();
  const { users: employeesFromStore } = useUserStore();
  const { membership } = useSessionStore();

  const isAdmin = useMemo(() => {
    const roleName = (membership?.role?.name || "").toLowerCase();
    return (
      [
        "admin",
        "owner",
        "propietario",
        "creador",
        "administrador",
        "gerente",
      ].includes(roleName) ||
      roleName.includes("admin") ||
      roleName.includes("owner")
    );
  }, [membership?.role?.name]);

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const branchesToUse = useMemo(() => branches, [branches]);
  const employeesToUse = useMemo(
    () =>
      employeesFromStore.map((u: any) => ({
        id: u.id,
        name: u.name || u.email,
        dni: u.dni || "",
        membershipId: u.membershipId,
        branchId: "all",
        avatar: "",
        defaultShift: "morning" as const,
        joiningDate: u.createdAt ? new Date(u.createdAt) : new Date(2000, 0, 1),
      })),
    [employeesFromStore],
  );

  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    employee: { id: string; name: string; dni: string };
    date: Date;
    record?: AttendanceRecord;
    activeShift?: { name: string; startTime: string; endTime: string };
    isPast?: boolean;
  } | null>(null);

  const [scanModalOpen, setScanModalOpen] = useState(false);

  const weekStart = useMemo(() => {
    return startOfWeek(currentWeek, { weekStartsOn: 1 });
  }, [currentWeek]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [allAssignments, setAllAssignments] = useState<ShiftAssignment[]>([]);

  useEffect(() => {
    async function loadRecords() {
      try {
        const end = addDays(weekStart, 6);
        const { records, assignments } = await getWeeklyAttendanceAction(
          weekStart,
          end,
        );
        setAllRecords(records);
        setAllAssignments(assignments);
      } catch (e) {
        console.error(e);
      }
    }
    loadRecords();
  }, [weekStart]);

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

  const employeesToShow = useMemo(() => {
    let filtered = employeesToUse;
    if (selectedBranch !== "all")
      filtered = filtered.filter((e) => e.branchId === selectedBranch);
    if (selectedEmployee !== "all")
      filtered = filtered.filter((e) => e.id === selectedEmployee);
    return filtered;
  }, [employeesToUse, selectedBranch, selectedEmployee]);

  const stats = useMemo(() => {
    const counts = {
      present: 0,
      late: 0,
      absent: 0,
      dayoff: 0,
      manual: 0,
      justified: 0,
    };

    const today = startOfDay(new Date());

    // Para las estadísticas usamos todos los registros de los empleados visibles,
    // INCLUSO si hay un filtro de estado activo en la tabla.
    employeesToShow.forEach((employee) => {
      const joiningDate = employee.joiningDate || new Date(2000, 0, 1);
      
      weekDays.forEach((day) => {
        // Ignorar si es antes de que el empleado fuera registrado
        if (isBefore(day, startOfDay(joiningDate))) return;

        // Buscamos en ALL_RECORDS (filtrado solo por empleado/branch) para contar todo
        const record = allRecords.find(
          (r) => r.employeeId === employee.id && 
                 isSameDay(r.date, day) &&
                 (selectedBranch === "all" || r.branchId === selectedBranch)
        );

        if (record) {
          // Conteo independiente: puede ser manual y a la vez tener un estado primario
          if (record.isManual || record.status === "manual") {
            counts.manual++;
          } 
          
          if (record.status in counts && record.status !== "manual") {
            counts[record.status as keyof typeof counts]++;
          }
          return;
        }

        // Si no hay registro, ver si es falta
        const activeAssignment = allAssignments.find((a) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const startStr = format(new Date(a.startDate), "yyyy-MM-dd");
          const endStr = a.endDate ? format(new Date(a.endDate), "yyyy-MM-dd") : "9999-12-31";
          return a.employeeId === employee.id && dayStr >= startStr && dayStr <= endStr;
        });

        if (!activeAssignment) {
          counts.dayoff++;
          return;
        }

        const isToday = isSameDay(day, today);
        const isPast = isBefore(day, today);

        let isTodayOverdue = false;
        if (isToday && activeAssignment.shift) {
          isTodayOverdue = checkIsOverdue(activeAssignment.shift.startTime);
        }

        if (isPast || isTodayOverdue) {
          counts.absent++;
        } else {
          counts.dayoff++;
        }
      });
    });

    return counts;
  }, [employeesToShow, weekDays, allRecords, allAssignments, selectedBranch]);

  const handleCellClick = (employee: any, date: Date) => {
    const existing = filteredRecords.find(
      (r) => r.employeeId === employee.id && isSameDay(r.date, date),
    );

    const isToday = isSameDay(date, new Date());
    const isPast = isBefore(date, startOfDay(new Date()));

    const activeAssignment = allAssignments.find((a) => {
      const startStr = format(new Date(a.startDate), "yyyy-MM-dd");
      const endStr = a.endDate
        ? format(new Date(a.endDate), "yyyy-MM-dd")
        : "9999-12-31";
      const dayStr = format(date, "yyyy-MM-dd");
      return (
        a.employeeId === employee.id && dayStr >= startStr && dayStr <= endStr
      );
    });

    let isTodayOverdue = false;
    if (isToday && !existing && activeAssignment?.shift) {
      isTodayOverdue = checkIsOverdue(activeAssignment.shift.startTime);
    }

    setSelectedCell({
      employee,
      date,
      record: existing,
      isPast: isPast || isTodayOverdue,
      activeShift: activeAssignment?.shift,
    });
    setMarkModalOpen(true);
  };

  const handleScanDni = async (dni: string) => {
    const loadingToast = toast.loading("Procesando escaneo...");
    try {
      const res = await scanDniAction(dni);
      const end = addDays(weekStart, 6);
      const { records, assignments } = await getWeeklyAttendanceAction(
        weekStart,
        end,
      );
      setAllRecords(records);
      setAllAssignments(assignments);
      setScanModalOpen(false);
      toast.success(`Asistencia marcada para ${res.employeeName}`, {
        id: loadingToast,
      });
    } catch (e: any) {
      toast.error("Error al escanear DNI", {
        id: loadingToast,
        description: e.message || "No se pudo procesar el escaneo.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(stats).map(([status, count]) => {
          const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          const Icon = config.icon;
          return (
            <Card
              key={status}
              className={cn(
                "border-l-4",
                config.color.replace("bg-", "border-"),
              )}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", config.bg)}>
                  <Icon className={cn("w-4 h-4", config.text)} />
                </div>
                <div>
                  <p className={cn("text-xl font-bold", config.text)}>
                    {count}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {config.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[180px]">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Branch" />
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
            <SelectTrigger className="w-[180px]">
              <User className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Empleado" />
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
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
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

        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              className="rounded-none border-r"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentWeek(new Date())}
              className="rounded-none border-r text-xs font-bold"
            >
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="rounded-none"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Popover open={scanModalOpen} onOpenChange={setScanModalOpen}>
            <PopoverTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <ScanLine className="w-4 h-4" />
                DNI
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden border-none shadow-2xl">
              <DniScanner onScan={handleScanDni} />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setMarkModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Manual
          </Button>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <ScrollArea className="w-full">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[180px] min-w-[180px] sticky left-0 bg-card/50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Empleado
                  </TableHead>
                  {weekDays.map((day, idx) => (
                    <TableHead
                      key={idx}
                      className="w-[100px] min-w-[100px] text-center p-2 border-r last:border-r-0"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 leading-none mb-1">
                          {WEEK_DAYS[idx]}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium uppercase leading-none">
                          {format(day, "d MMM", { locale: es })}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesToShow.map((employee) => (
                  <TableRow key={employee.id} className="group">
                    <TableCell className="font-medium p-2 border-r sticky left-0z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {employee.name
                            .split(" ")
                            .map((n: any) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-400 truncate leading-tight">
                            {employee.name}
                          </p>
                          <p className="text-xs text-slate-400/60 font-mono leading-none">
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
                      // console.log("minutos", record?.lateMinutes);
                      const isToday = isSameDay(day, new Date());
                      const isPast = isBefore(day, startOfDay(new Date()));

                      const activeAssignment = allAssignments.find((a) => {
                        const dayStr = format(day, "yyyy-MM-dd");
                        const startStr = format(
                          new Date(a.startDate),
                          "yyyy-MM-dd",
                        );
                        const endStr = a.endDate
                          ? format(new Date(a.endDate), "yyyy-MM-dd")
                          : "9999-12-31";
                        return (
                          a.employeeId === employee.id &&
                          dayStr >= startStr &&
                          dayStr <= endStr
                        );
                      });

                      // NUEVA LÓGICA: Comprobar fecha de ingreso
                      const joiningDate =
                        employee.joiningDate || new Date(2000, 0, 1);
                      const isBeforeJoining = isBefore(
                        day,
                        startOfDay(joiningDate),
                      );

                      let isTodayOverdue = false;
                      if (isToday && !record && activeAssignment?.shift) {
                        isTodayOverdue = checkIsOverdue(
                          activeAssignment.shift.startTime,
                        );
                      }

                      // Solo es falta si tenia turno asignado Y es posterior al ingreso
                      const isFalta =
                        (isPast || isTodayOverdue) && !!activeAssignment;
                      const config = record
                        ? STATUS_CONFIG[record.status]
                        : isFalta
                          ? STATUS_CONFIG.absent
                          : STATUS_CONFIG.dayoff;
                      const Icon = config.icon;

                      return (
                        <TableCell
                          key={idx}
                          className={cn(
                            "p-1 border-r min-w-[100px] last:border-r-0",
                            isAdmin && "cursor-pointer",
                          )}
                          onClick={() =>
                            isAdmin && handleCellClick(employee, day)
                          }
                        >
                          <div
                            className={cn(
                              "h-14 rounded-lg border transition-all p-1.5 flex flex-col gap-0.5 relative overflow-hidden",
                              record
                                ? cn(config.bg, "border-transparent shadow-sm")
                                : isFalta
                                  ? "bg-red-700/50 border-red-500/30 text-white shadow-inner"
                                  : "bg-slate-900/5 border-dashed border-slate-400 group-hover:border-slate-300",
                            )}
                          >
                            {record ? (
                              <>
                                <div className="flex items-center justify-between gap-1 overflow-hidden">
                                  {activeAssignment?.shift ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 h-4 bg-white/50 border-none truncate"
                                    >
                                      {activeAssignment.shift.name}
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="secondary"
                                      className="text-[7px] px-1 h-3.5 bg-amber-100 text-amber-700 border-none font-black uppercase"
                                    >
                                      Sin Turno
                                    </Badge>
                                  )}
                                  <Icon
                                    className={cn(
                                      "w-3.5 h-3.5 shrink-0",
                                      config.text,
                                    )}
                                  />
                                </div>
                                {record.checkIn ? (
                                  <div className="flex-1 flex flex-col justify-center items-center">
                                    <span
                                      className={cn(
                                        "text-xs font-bold leading-none mb-0.5",
                                        config.text,
                                      )}
                                    >
                                      {record.checkIn}
                                    </span>
                                    {record.checkOut && (
                                      <span
                                        className={cn(
                                          "text-[10px] opacity-70 leading-none",
                                          config.text,
                                        )}
                                      >
                                        {record.checkOut}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex-1 flex items-center justify-center font-bold text-[10px] uppercase">
                                    {config.label}
                                  </div>
                                )}
                                <div className="mt-auto flex items-center justify-between text-[10px] font-medium">
                                  {record.lateMinutes ? (
                                    <span className="text-yellow-600">
                                      +{formatLateMinutes(record.lateMinutes)}
                                    </span>
                                  ) : (
                                    <span></span>
                                  )}
                                  <div className="flex gap-0.5">
                                    {record.isManual && (
                                      <span className="text-[8px] bg-blue-100 text-blue-600 px-1 rounded font-bold">
                                        M
                                      </span>
                                    )}
                                    {record.justification && (
                                      <span className="text-[8px] bg-purple-100 text-purple-600 px-1 rounded font-bold">
                                        J
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center gap-1">
                                {isBeforeJoining ? (
                                  <div className="flex flex-col items-center gap-0.5 opacity-20">
                                    <XCircle className="w-4 h-4 text-slate-400" />
                                    <span className="text-[8px] font-black uppercase text-slate-500 leading-none">
                                      No Registrado
                                    </span>
                                  </div>
                                ) : isFalta ? (
                                  <>
                                    <AlertTriangle className="w-4 h-4 text-white/80" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter text-white leading-none">
                                      FALTA
                                    </span>
                                    <span className="text-[8px] text-white/60 font-bold leading-none">
                                      (Editar)
                                    </span>
                                  </>
                                ) : !activeAssignment ? (
                                  <div className="flex flex-col items-center gap-0.5 opacity-60">
                                    <Minus className="w-4 h-4 text-slate-300" />
                                    <span className="text-[8px] font-black uppercase text-slate-300 leading-none">
                                      Reg. (Sin Turno)
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-5 h-5 text-slate-300" />
                                    <span className="text-[9px] text-slate-300 font-bold uppercase leading-none">
                                      Añadir
                                    </span>
                                  </div>
                                )}
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

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
            <div key={k} className="flex items-center gap-2">
              <div className={cn("w-2.5 h-2.5 rounded-full", cfg.color)} />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                {cfg.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black">
              M
            </span>{" "}
            <span className="text-[11px] text-slate-500 font-medium">
              Marcación Manual
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-black">
              J
            </span>{" "}
            <span className="text-[11px] text-slate-500 font-medium">
              Justificado
            </span>
          </div>
        </div>
      </div>

      <MarkAttendanceModal
        isOpen={markModalOpen}
        onClose={() => setMarkModalOpen(false)}
        employee={selectedCell?.employee || null}
        date={selectedCell?.date || new Date()}
        existingRecord={selectedCell?.record}
        activeShift={selectedCell?.activeShift}
        isPast={selectedCell?.isPast}
        onSubmit={(data) => {
          if (selectedCell) {
            onMarkAttendance({
              employeeId: selectedCell.employee.id,
              date: selectedCell.date,
              checkIn: data.checkIn,
              checkOut: data.checkOut,
              shift: data.shift,
              shiftId: data.shiftId,
              notes: data.notes,
              status: data.status,
              lateMinutes: data.lateMinutes,
              extraMinutes: data.extraMinutes,
            });
          }
        }}
        onJustify={(justification, notes) => {
          if (selectedCell && onJustifyAbsence) {
            onJustifyAbsence({
              employeeId: selectedCell.employee.id,
              date: selectedCell.date,
              justification,
              notes,
            });
          }
        }}
      />
    </div>
  );
}

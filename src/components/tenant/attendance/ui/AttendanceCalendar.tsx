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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Clock,
  MapPin,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Minus,
  Edit3,
  Briefcase,
  Zap,
  AlertTriangle,
  FileText,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  isSameDay,
  differenceInMinutes,
  parse,
} from "date-fns";
import { es } from "date-fns/locale";

// Tipos actualizados
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDni: string;
  avatar?: string;
  date: Date;
  shift: "morning" | "afternoon" | "night" | "custom"; // Turno
  checkIn?: string;
  checkOut?: string;
  status: "present" | "late" | "absent" | "dayoff" | "manual" | "justified";
  notes?: string;
  branchId: string;
  isManual: boolean;
  lateMinutes?: number;
  extraHours?: number; // Horas extra calculadas
  extraMinutes?: number; // Minutos extra para mostrar
  justification?: string; // Justificación de ausencia
}

// Mock de datos actualizado


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

// Función para calcular tardanza y horas extra
const calculateAttendanceMetrics = (
  checkIn: string,
  checkOut: string,
  shift: string,
  status: string,
): { lateMinutes: number; extraHours: number; extraMinutes: number } => {
  if (status === "absent" || status === "dayoff" || !checkIn || !checkOut) {
    return { lateMinutes: 0, extraHours: 0, extraMinutes: 0 };
  }

  const shiftConfig =
    SHIFT_CONFIG[shift as keyof typeof SHIFT_CONFIG] || SHIFT_CONFIG.morning;
  const scheduledStart = parse(shiftConfig.start, "HH:mm", new Date());
  const scheduledEnd = parse(shiftConfig.end, "HH:mm", new Date());
  const actualStart = parse(checkIn, "HH:mm", new Date());
  const actualEnd = parse(checkOut, "HH:mm", new Date());

  // Calcular tardanza (solo si llega después de la hora programada)
  let lateMinutes = 0;
  if (actualStart > scheduledStart) {
    lateMinutes = differenceInMinutes(actualStart, scheduledStart);
  }

  // Calcular horas extra (tiempo trabajado después de la hora de salida programada)
  let extraMinutes = 0;
  if (actualEnd > scheduledEnd) {
    extraMinutes = differenceInMinutes(actualEnd, scheduledEnd);
  }

  const extraHours = Math.floor(extraMinutes / 60);
  const remainingExtraMinutes = extraMinutes % 60;

  return { lateMinutes, extraHours, extraMinutes: remainingExtraMinutes };
};

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

// Componente de escaneo DNI (sin cambios)
function DniScanner({
  onScan,
  employees,
}: {
  onScan: (dni: string) => void;
  employees: any[];
}) {
  const [scanning, setScanning] = useState(false);
  const [manualDni, setManualDni] = useState("");

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      const randomDni =
        employees[Math.floor(Math.random() * employees.length)]?.dni || "";
      onScan(randomDni);
      setScanning(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors",
          scanning
            ? "border-green-500 bg-green-50 animate-pulse"
            : "border-muted hover:border-primary",
        )}
        onClick={!scanning ? simulateScan : undefined}
      >
        {scanning ? (
          <div className="text-center">
            <ScanLine className="w-12 h-12 text-green-500 mx-auto mb-2 animate-bounce" />
            <p className="text-sm text-green-600 font-medium">
              Escaneando DNI...
            </p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <ScanLine className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Haz clic para escanear DNI</p>
            <p className="text-xs mt-1">o ingresa manualmente</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Ingreso manual:</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Número de DNI"
            value={manualDni}
            onChange={(e) => setManualDni(e.target.value)}
            className="font-mono"
            maxLength={8}
          />
          <Button
            onClick={() => manualDni && onScan(manualDni)}
            disabled={manualDni.length < 8}
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}

// Modal de marcación manual mejorado
function MarkAttendanceModal({
  isOpen,
  onClose,
  employee,
  date,
  existingRecord,
  onSubmit,
  onJustify,
}: {
  isOpen: boolean;
  onClose: () => void;
  employee: any | null;
  date: Date;
  existingRecord?: AttendanceRecord;
  onSubmit: (data: {
    checkIn: string;
    checkOut: string;
    shift: string;
    notes?: string;
    status: AttendanceRecord["status"];
  }) => void;
  onJustify?: (justification: string) => void;
}) {
  const [formData, setFormData] = useState({
    checkIn: existingRecord?.checkIn || "08:00",
    checkOut: existingRecord?.checkOut || "17:00",
    notes: existingRecord?.notes || "",
    status: existingRecord?.status || "present",
    shift: existingRecord?.shift || employee?.defaultShift || "morning",
    justification: existingRecord?.justification || "",
  });

  const [activeTab, setActiveTab] = useState<"mark" | "justify">("mark");

  // Calcular métricas en tiempo real para preview
  const metrics = useMemo(() => {
    if (formData.status === "absent" || formData.status === "dayoff")
      return null;
    return calculateAttendanceMetrics(
      formData.checkIn,
      formData.checkOut,
      formData.shift,
      formData.status,
    );
  }, [formData.checkIn, formData.checkOut, formData.shift, formData.status]);

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {existingRecord ? "Editar Registro" : "Marcar Asistencia"}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === "mark" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("mark")}
            className="gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Marcar/Editar
          </Button>
          <Button
            variant={activeTab === "justify" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("justify")}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Justificar Ausencia
          </Button>
        </div>

        <div className="space-y-4 pt-4">
          {/* Info del empleado */}
          <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              {employee.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </div>
            <div>
              <p className="text-sm font-medium">{employee.name}</p>
              <p className="text-xs text-muted-foreground">
                DNI: {employee.dni}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(date, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>

          {activeTab === "mark" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Turno
                  </Label>
                  <Select
                    value={formData.shift}
                    onValueChange={(val) =>
                      setFormData({ ...formData, shift: val as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SHIFT_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{config.label}</span>
                            <span className="text-xs text-muted-foreground">
                              ({config.start} - {config.end})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) =>
                      setFormData({ ...formData, status: val as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                config.color,
                              )}
                            />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.status !== "absent" && formData.status !== "dayoff" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hora entrada</Label>
                      <Input
                        type="time"
                        value={formData.checkIn}
                        onChange={(e) =>
                          setFormData({ ...formData, checkIn: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora salida</Label>
                      <Input
                        type="time"
                        value={formData.checkOut}
                        onChange={(e) =>
                          setFormData({ ...formData, checkOut: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Preview de cálculos */}
                  {metrics && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle
                          className={cn(
                            "w-4 h-4",
                            metrics.lateMinutes > 0
                              ? "text-yellow-500"
                              : "text-gray-400",
                          )}
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Tardanza
                          </p>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              metrics.lateMinutes > 0
                                ? "text-yellow-600"
                                : "text-green-600",
                            )}
                          >
                            {metrics.lateMinutes > 0
                              ? `${metrics.lateMinutes} min`
                              : "A tiempo"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap
                          className={cn(
                            "w-4 h-4",
                            metrics.extraHours > 0 || metrics.extraMinutes > 0
                              ? "text-orange-500"
                              : "text-gray-400",
                          )}
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Horas Extra
                          </p>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              metrics.extraHours > 0 || metrics.extraMinutes > 0
                                ? "text-orange-600"
                                : "text-gray-600",
                            )}
                          >
                            {metrics.extraHours > 0 || metrics.extraMinutes > 0
                              ? `${metrics.extraHours}h ${metrics.extraMinutes}m`
                              : "Sin extra"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label>Notas / Motivo</Label>
                <Input
                  placeholder="Ej: Llegada tardía por tráfico, trabajo extraordinario..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Justificación de Ausencia
                </Label>
                <Select
                  value={formData.justification}
                  onValueChange={(val) =>
                    setFormData({ ...formData, justification: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de justificación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="licencia_medica">
                      Licencia Médica
                    </SelectItem>
                    <SelectItem value="vacaciones">Vacaciones</SelectItem>
                    <SelectItem value="permiso_personal">
                      Permiso Personal
                    </SelectItem>
                    <SelectItem value="capacitacion">Capacitación</SelectItem>
                    <SelectItem value="fallecimiento_familiar">
                      Fallecimiento Familiar
                    </SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Detalles adicionales</Label>
                <Input
                  placeholder="Especificar detalles de la justificación..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5" />
                <p className="text-xs text-purple-700">
                  Al justificar la ausencia, el estado cambiará a &quot;Justificado&quot;
                  y no contará como falta injustificada.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (activeTab === "justify" && onJustify) {
                  onJustify(formData.justification);
                } else {
                  onSubmit({
                    checkIn: formData.checkIn,
                    checkOut: formData.checkOut,
                    shift: formData.shift,
                    notes: formData.notes,
                    status:
                      activeTab === "justify" ? "justified" : formData.status,
                  });
                }
                onClose();
              }}
            >
              {activeTab === "justify"
                ? "Justificar Ausencia"
                : "Guardar Registro"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AttendanceCalendar({
  onMarkAttendance,
  onScanDni,
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

  const handleCellClick = (
    employee: any,
    date: Date,
  ) => {
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
  }, [selectedBranch, selectedEmployee]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            Control de Asistencia
          </h1>
          <p className="text-muted-foreground text-sm">
            Semana del {format(weekStart, "d 'de' MMMM", { locale: es })}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <Popover open={scanModalOpen} onOpenChange={setScanModalOpen}>
            <PopoverTrigger asChild>
              <Button className="gap-2 ml-2">
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
            className="gap-2"
            onClick={() => setMarkModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Manual
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[180px]">
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

            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("w-2 h-2 rounded-full", config.color)}
                      />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-6 gap-3">
        {Object.entries(stats).map(([status, count]) => {
          const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          const Icon = config.icon;

          return (
            <Card
              key={status}
              className={cn(
                "border-l-4",
                config.bg.replace("bg-", "border-l-"),
              )}
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

      {/* Tabla mejorada con Turno y Extra */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Vista semanal detallada
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[1000px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
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
                                  : "bg-gray-50 border-dashed border-gray-200 hover:border-gray-300",
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
        </CardContent>
      </Card>

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

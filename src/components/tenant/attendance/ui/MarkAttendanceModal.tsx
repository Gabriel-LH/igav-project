// Modal de marcación manual mejorado

import { useState, useMemo } from "react";
import { differenceInMinutes, format, parse } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Clock,
  Edit3,
  FileText,
  Briefcase,
  AlertCircle,
  Zap,
  AlertTriangle,
  XCircle,
  Minus,
  CheckCircle2,
} from "lucide-react";

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

export function MarkAttendanceModal({
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
                  Al justificar la ausencia, el estado cambiará a
                  &quot;Justificado&quot; y no contará como falta injustificada.
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

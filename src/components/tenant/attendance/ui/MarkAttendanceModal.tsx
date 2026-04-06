// Modal de marcación manual mejorado

import { useState, useMemo, useEffect } from "react";
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
  AlertCircle,
  AlertTriangle,
  XCircle,
  Minus,
  CheckCircle2,
} from "lucide-react";

import { getShiftsAction } from "@/src/app/(tenant)/tenant/actions/shift.actions";

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
  shiftIdOrName: string,
  status: string,
): { lateMinutes: number; extraHours: number; extraMinutes: number } => {
  if (status === "absent" || status === "dayoff" || !checkIn || !checkOut) {
    return { lateMinutes: 0, extraHours: 0, extraMinutes: 0 };
  }

  const config = SHIFT_CONFIG[shiftIdOrName as keyof typeof SHIFT_CONFIG] || SHIFT_CONFIG.morning;
  const scheduledStart = parse(config.start, "HH:mm", new Date());
  const scheduledEnd = parse(config.end, "HH:mm", new Date());

  // Asegurar que checkIn y checkOut son strings antes de hacer el parse
  const checkInStr = typeof checkIn === 'string' ? checkIn : (checkIn instanceof Date ? format(checkIn, "HH:mm") : "08:00");
  const checkOutStr = typeof checkOut === 'string' ? checkOut : (checkOut instanceof Date ? format(checkOut, "HH:mm") : "17:00");

  const actualStart = parse(checkInStr, "HH:mm", new Date());
  const actualEnd = parse(checkOutStr, "HH:mm", new Date());

  let lateMinutes = 0;
  if (actualStart > scheduledStart) {
    lateMinutes = differenceInMinutes(actualStart, scheduledStart);
  }

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
  shift: string;
  shiftId?: string;
  checkIn?: string;
  checkOut?: string;
  status: "present" | "late" | "absent" | "dayoff" | "manual" | "justified";
  notes?: string;
  branchId: string;
  isManual: boolean;
  lateMinutes?: number;
  extraHours?: number;
  extraMinutes?: number;
  justification?: string;
}

export function MarkAttendanceModal({
  isOpen,
  onClose,
  employee,
  date,
  existingRecord,
  activeShift,
  isPast,
  onSubmit,
  onJustify,
}: {
  isOpen: boolean;
  onClose: () => void;
  employee: any | null;
  date: Date;
  existingRecord?: AttendanceRecord;
  activeShift?: any;
  isPast?: boolean;
  onSubmit: (data: {
    checkIn: string;
    checkOut: string;
    shift: string;
    shiftId?: string;
    notes?: string;
    status: AttendanceRecord["status"];
    lateMinutes?: number;
    extraMinutes?: number;
  }) => void;
  onJustify?: (justification: string, notes: string) => void;
}) {
  const [formData, setFormData] = useState({
    checkIn: "08:00",
    checkOut: "17:00",
    notes: "",
    status: "present" as AttendanceRecord["status"],
    shift: "morning",
    shiftId: undefined as string | undefined,
    justification: "licencia_medica",
  });

  const [availableShifts, setAvailableShifts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"mark" | "justify">("mark");

  // Load shifts for dropdown
  useEffect(() => {
    async function loadShifts() {
      try {
        const shifts = await getShiftsAction();
        setAvailableShifts(shifts);
      } catch (e) {
        console.error("Error al cargar turnos:", e);
      }
    }
    if (isOpen) loadShifts();
  }, [isOpen]);

  // Sync form when modal state changes
  useEffect(() => {
    if (isOpen) {
      if (existingRecord) {
        // Limpiamos las notas de posibles etiquetas de depuración antiguas [V16-CLIENT]
        const cleanNotes = (existingRecord.notes || "")
          .replace(/\[V16-CLIENT\].*?DELAY:\d+/g, "")
          .replace(/\s\s+/g, " ")
          .trim();

        // Limpiamos las fomas de fechas si vienen como objetos Date (de la DB)
        const formatTime = (val: any) => {
          if (!val) return "";
          if (typeof val === 'string') return val;
          if (val instanceof Date) return format(val, "HH:mm");
          return String(val);
        };

        setFormData({
          checkIn: formatTime(existingRecord.checkIn) || "08:00",
          checkOut: formatTime(existingRecord.checkOut) || "17:00",
          notes: cleanNotes,
          status: existingRecord.status,
          shift: existingRecord.shift,
          shiftId: existingRecord.shiftId,
          justification: existingRecord.justification || "licencia_medica",
        });
        if (existingRecord.status === "justified") setActiveTab("justify");
      } else {
        const defaultShiftName = activeShift?.name || employee?.defaultShift || "morning";
        const defaultShiftId = activeShift?.id || undefined;
        let defaultCheckIn = "08:00";
        let defaultCheckOut = "17:00";

        if (activeShift?.startTime) {
          defaultCheckIn = activeShift.startTime;
          defaultCheckOut = activeShift.endTime || "17:00";
        } else {
          const config = SHIFT_CONFIG[defaultShiftName as keyof typeof SHIFT_CONFIG];
          if (config) {
            defaultCheckIn = config.start;
            defaultCheckOut = config.end;
          }
        }
        
        setFormData({
          checkIn: defaultCheckIn,
          checkOut: defaultCheckOut,
          notes: "",
          status: isPast ? "absent" : "present",
          shift: defaultShiftName,
          shiftId: defaultShiftId,
          justification: "licencia_medica",
        });
        setActiveTab("mark");
      }
    }
  }, [isOpen, existingRecord, employee, activeShift, isPast]);

  const metrics = useMemo(() => {
    if (formData.status === "absent" || formData.status === "dayoff" || formData.status === "justified") return null;
    return calculateAttendanceMetrics(formData.checkIn, formData.checkOut, formData.shift, formData.status);
  }, [formData.checkIn, formData.checkOut, formData.shift, formData.status]);

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {existingRecord ? "Detalles del Registro" : "Marcar Asistencia Manual"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 border-b">
          <Button variant={activeTab === "mark" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("mark")} className="rounded-none border-b-2 border-transparent data-[variant=default]:border-primary h-10">Marcar/Editar</Button>
          <Button variant={activeTab === "justify" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("justify")} className="rounded-none border-b-2 border-transparent data-[variant=default]:border-primary h-10">Justificar Ausencia</Button>
        </div>

        <div className="space-y-4 pt-4">
          <div className="p-3 bg-muted/40 rounded-xl flex items-center gap-3 border border-muted-foreground/10">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-primary/5">
              {employee.name.split(" ").map((n: any) => n[0]).join("").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-none mb-1">{employee.name}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase">{format(date, "EEEE, d 'de' MMMM", { locale: es })}</p>
            </div>
          </div>

          {activeTab === "mark" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Turno Aplicado</Label>
                <Select 
                  value={formData.shiftId || formData.shift} 
                  onValueChange={(val) => {
                    const selected = availableShifts.find(s => s.id === val || s.name === val);
                    const config = SHIFT_CONFIG[val as keyof typeof SHIFT_CONFIG];
                    
                    let newCheckIn = formData.checkIn;
                    let newCheckOut = formData.checkOut;

                    if (selected) {
                      newCheckIn = selected.startTime;
                      newCheckOut = selected.endTime || "17:00";
                    } else if (config && val !== "custom") {
                      newCheckIn = config.start;
                      newCheckOut = config.end;
                    }

                    setFormData({ 
                      ...formData, 
                      shiftId: selected?.id || (val === "custom" ? "custom" : (val.length > 20 ? val : undefined)),
                      shift: selected?.name || (config ? config.label : val),
                      checkIn: newCheckIn,
                      checkOut: newCheckOut,
                    });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableShifts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <span>{s.name}</span>
                          <span className="text-[10px] opacity-60">({s.startTime}-{s.endTime})</span>
                        </div>
                      </SelectItem>
                    ))}
                    {availableShifts.length === 0 && Object.entries(SHIFT_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Estado</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
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

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Entrada</Label>
                <Input 
                  type="time" 
                  value={formData.checkIn} 
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })} 
                  disabled={formData.status === "absent"} 
                  readOnly={(() => {
                    const isCustom = formData.shiftId === "custom" || formData.shift === "custom" || formData.shift === "Personalizado";
                    return !isCustom;
                  })()}
                  className={cn(
                    (() => {
                      const isCustom = formData.shiftId === "custom" || formData.shift === "custom" || formData.shift === "Personalizado";
                      return !isCustom;
                    })() && "bg-slate-50/50 cursor-not-allowed opacity-80"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Salida</Label>
                <Input 
                  type="time" 
                  value={formData.checkOut} 
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })} 
                  disabled={formData.status === "absent"} 
                  readOnly={(() => {
                    const isCustom = formData.shiftId === "custom" || formData.shift === "custom" || formData.shift === "Personalizado";
                    return !isCustom;
                  })()}
                  className={cn(
                    (() => {
                      const isCustom = formData.shiftId === "custom" || formData.shift === "custom" || formData.shift === "Personalizado";
                      return !isCustom;
                    })() && "bg-slate-50/50 cursor-not-allowed opacity-80"
                  )}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Motivo de Justificación</Label>
                <Select value={formData.justification} onValueChange={(v) => setFormData({ ...formData, justification: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="licencia_medica">Licencia Médica</SelectItem>
                    <SelectItem value="vacaciones">Vacaciones</SelectItem>
                    <SelectItem value="permiso_personal">Permiso Personal</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-purple-100/5 border  rounded-lg flex items-start gap-3">
                 <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5" />
                 <p className="text-xs text-purple-700 leading-tight">Al justificar, el estado pasará a ser <b>Justificado</b> y no contará como falta para el reporte mensual.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Notas Adicionales</Label>
            <Input placeholder="Observaciones del administrador..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          {metrics && (
             <div className="bg-slate-300/30 p-3 rounded-lg border flex gap-4 text-center">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tardanza</p>
                  <p className={cn("text-lg font-black", metrics.lateMinutes > 0 ? "text-yellow-600" : "text-slate-400")}>{metrics.lateMinutes}m</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">H. Extra</p>
                  <p className={cn("text-lg font-black", metrics.extraHours > 0 || metrics.extraMinutes > 0 ? "text-orange-600" : "text-slate-400")}>{metrics.extraHours}h {metrics.extraMinutes}m</p>
                </div>
             </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} className="font-bold">Cancelar</Button>
            <Button 
              className={cn("font-bold px-8", activeTab === "justify" ? "bg-purple-600 hover:bg-purple-700" : "")}
              onClick={() => {
                if (activeTab === "justify" && onJustify) {
                  onJustify(formData.justification, formData.notes);
                } else {
                  onSubmit({
                    checkIn: formData.checkIn,
                    checkOut: formData.checkOut,
                    shift: formData.shift,
                    shiftId: formData.shiftId,
                    notes: formData.notes,
                    status: activeTab === "justify" ? "justified" : formData.status,
                    lateMinutes: metrics?.lateMinutes,
                    extraMinutes: metrics?.extraMinutes,
                  });
                }
                onClose();
              }}
            >
              {activeTab === "justify" ? "Guardar Justificación" : existingRecord ? "Actualizar" : "Registrar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

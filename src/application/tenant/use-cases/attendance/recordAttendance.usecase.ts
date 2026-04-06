import { AttendanceRepository, CreateAttendanceDTO, UpdateAttendanceDTO, AttendanceRecordDTO } from "@/src/domain/tenant/repositories/AttendanceRepository";
import { PrismaUnitOfWork } from "@/src/infrastructure/tenant/repositories/PrismaUnitOfWork";
import { ShiftRepository } from "@/src/domain/tenant/repositories/ShiftRepository";
import { differenceInMinutes } from "date-fns";

export interface MarkAttendanceInput {
  tenantId: string;
  userId: string;
  branchId: string;
  shiftId?: string; // Optional if we auto-detect
  workDate: Date;
  checkIn?: Date;
  checkOut?: Date;
  checkInTime?: string; // Nominal time "HH:mm"
  checkOutTime?: string; // Nominal time "HH:mm"
  lateMinutes?: number; // Pre-calculated (V16 Trust Client)
  extraMinutes?: number; // Pre-calculated (V16 Trust Client)
  notes?: string;
  status: string;
  isManual: boolean;
  justification?: string;
  source: string;
  createdBy: string;
}

export class RecordAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly shiftRepository: ShiftRepository,
    private readonly unitOfWork: PrismaUnitOfWork
  ) {}

  async execute(input: MarkAttendanceInput): Promise<AttendanceRecordDTO> {
    return this.unitOfWork.execute(async () => {
      let targetShiftId = input.shiftId;
      const targetBranchId = input.branchId;

      if (!targetShiftId) {
        const assignments = await this.shiftRepository.findAssignmentsByEmployee(input.userId, input.tenantId);
        const now = new Date();
        const userAssignment = assignments.find((a: any) => {
          const startDate = new Date(a.startDate);
          const endDate = a.endDate ? new Date(a.endDate) : null;
          return now >= startDate && (endDate === null || now <= endDate);
        });

        if (userAssignment) {
          targetShiftId = userAssignment.shiftId;
        } else {
          // If no active, use the most recent one if available
          if (assignments.length > 0) {
            targetShiftId = assignments[0].shiftId;
          } else {
            throw new Error("El empleado no tiene un turno asignado.");
          }
        }
      }

      const shift = await this.shiftRepository.findById(targetShiftId as string, input.tenantId);
      if (!shift) {
        throw new Error("El turno asignado no existe.");
      }

      // BLINDAJE ABSOLUTO (V15-FINAL): Forzamos la misma lógica del modal
      const timeToMinutes = (h: number, m: number) => h * 60 + m;
      
      const normalizedName = (shift.name || "").toLowerCase().trim();
      
      // Intentamos recuperar la hora real de Perú (GMT-5) desde el UTC de la DB
      // (Si DB dice 3 AM es porque realmente es 8 AM Lima)
      let startH = (shift.startTime.getUTCHours() + 5) % 24;
      let startM = shift.startTime.getUTCMinutes();
      
      // MAPA MAESTRO: Si el nombre coincide, ignoramos la hora de la base de datos
      const SHIFT_START_MAP: Record<string, number> = {
        "mañana": 8, "turno mañana": 8, "turno manana": 8, "manana": 8,
        "tarde": 14, "turno tarde": 14, "noche": 22, "turno noche": 22,
        "morning": 8, "afternoon": 14, "night": 22, "administrativo": 8,
        "oficina": 8, "general": 8, "rotativo": 8
      };
      
      for (const [key, val] of Object.entries(SHIFT_START_MAP)) {
        if (normalizedName.includes(key)) {
          startH = val;
          startM = 0;
          break;
        }
      }

      const scheduledStart = new Date(input.workDate);
      scheduledStart.setHours(startH, startM, 0, 0);

      const scheduledEnd = new Date(input.workDate);
      if (shift.endTime) {
        const endTimeStr = shift.endTime.toISOString().split("T")[1];
        const [endH, endM] = endTimeStr.split(":").map(Number);
        scheduledEnd.setHours(endH, endM, 0, 0);
      } else {
        scheduledEnd.setHours(23, 59, 59, 999);
      }

      // Si el turno termina antes de empezar (ej. turno noche), el fin es al día siguiente
      if (scheduledEnd < scheduledStart) {
        scheduledEnd.setDate(scheduledEnd.getDate() + 1);
      }

      // BLOQUEO DE ESCÁNER: Si no es manual y ya pasó la hora del turno
      const now = new Date();
      if (!input.isManual && input.source === "dni-scanner" && now > scheduledEnd) {
        // Permitir solo si es un check-out (ya tiene un registro previo con entrada pero sin salida)
        const existingRef = await this.attendanceRepository.findByEmployeeAndDate(
          input.tenantId,
          input.userId,
          input.workDate
        );
        
        const isCheckingOut = !!(existingRef && existingRef.checkIn && !existingRef.checkOut);
        
        if (!isCheckingOut) {
          throw new Error(`El turno de ${shift.name} ha finalizado (Fin: ${scheduledEnd.toLocaleTimeString()}). El registro debe ser manual por un administrador.`);
        }
      }

      let lateMinutes = 0;
      let extraMinutes = 0;
      let checkInH = 0;
      let checkInM = 0;
      let checkOutH = 0;
      let checkOutM = 0;

      if ((input.status === "present" || input.status === "late" || !input.status) && (input.checkIn || input.checkInTime)) {
        // EXTRACCIÓN NOMINAL: Usamos la hora tal cual la envió el modal
        if (input.checkInTime) {
          const [h, m] = input.checkInTime.split(":").map(Number);
          checkInH = h;
          checkInM = m;
        } else if (input.checkIn) {
          // Fallback: Si no hay string, forzamos -5h para Lima
          checkInH = (input.checkIn.getUTCHours() - 5 + 24) % 24;
          checkInM = input.checkIn.getUTCMinutes();
        }

        const checkInMins = timeToMinutes(checkInH, checkInM);
        const shiftStartMins = timeToMinutes(startH, startM);
        
        if (checkInMins > shiftStartMins) {
          const delay = checkInMins - shiftStartMins;
          if (delay > shift.toleranceMinutes) {
            lateMinutes = delay;
          }
        }
      }

      // V16: PRIORIDAD ABSOLUTA - Si el cliente ya calculó la tardanza, la usamos.
      if (input.lateMinutes !== undefined) {
        lateMinutes = input.lateMinutes;
      }

      if ((input.checkOut || input.checkOutTime) && shift.endTime) {
        const endH = shift.endTime.getUTCHours();
        const endM = shift.endTime.getUTCMinutes();
        
        if (input.checkOutTime) {
          const [h, m] = input.checkOutTime.split(":").map(Number);
          checkOutH = h;
          checkOutM = m;
        } else if (input.checkOut) {
          // Forzamos la extracción de la hora de Perú (UTC - 5)
          checkOutH = (input.checkOut.getUTCHours() - 5 + 24) % 24;
          checkOutM = input.checkOut.getUTCMinutes();
        }

        const checkOutMins = checkOutH * 60 + checkOutM;
        const shiftEndMins = endH * 60 + endM;

        if (checkOutMins > shiftEndMins) {
          extraMinutes = checkOutMins - shiftEndMins;
        }
      }

      // V16: PRIORIDAD ABSOLUTA - Si el cliente ya calculó las horas extra, las usamos.
      if (input.extraMinutes !== undefined) {
        extraMinutes = input.extraMinutes;
      }

      let finalStatus = input.status;
      // Autodetectar estado si no se provee uno específico (para el escáner)
      if (finalStatus === "present" || !finalStatus) {
        if (lateMinutes > 0) {
          finalStatus = "late";
        } else {
          finalStatus = "present";
        }
      }

      const existing = await this.attendanceRepository.findByEmployeeAndDate(
        input.tenantId,
        input.userId,
        input.workDate
      );

      // Limpieza de etiquetas de depuración antiguas en las notas
      const sanitizeNotes = (notes?: string | null): string | undefined => {
        if (!notes) return undefined;
        // Regex más robusto para capturar las etiquetas V16 incluso si están repetidas
        return notes.replace(/\[V16-CLIENT\].*?DELAY:\d+/g, "").replace(/\s\s+/g, " ").trim() || undefined;
      };

      if (existing) {
        const updateDto: UpdateAttendanceDTO = {
          checkIn: input.checkIn ?? existing.checkIn ?? undefined,
          checkOut: input.checkOut ?? existing.checkOut ?? undefined,
          notes: sanitizeNotes(input.notes ?? existing.notes),
          status: finalStatus,
          lateMinutes,
          extraMinutes,
          isManual: input.isManual,
          justification: (input.justification ?? existing.justification) || undefined,
          source: input.source,
        };
        return this.attendanceRepository.updateAttendance(existing.id, updateDto);
      } else {
        const createDto: CreateAttendanceDTO = {
          tenantId: input.tenantId,
          branchId: targetBranchId, 
          userId: input.userId,
          shiftId: targetShiftId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          notes: sanitizeNotes(input.notes),
          status: finalStatus,
          lateMinutes,
          extraMinutes,
          workDate: input.workDate,
          isManual: input.isManual,
          justification: input.justification,
          source: input.source,
          createdBy: input.createdBy,
        };
        return this.attendanceRepository.createAttendance(createDto);
      }
    });
  }

  async justifyAbsence(
    tenantId: string,
    userId: string,
    branchId: string,
    workDate: Date,
    justification: string,
    notes: string,
    createdBy: string
  ): Promise<AttendanceRecordDTO> {
    return this.execute({
      tenantId,
      userId,
      branchId, 
      workDate,
      status: "justified",
      justification,
      notes,
      isManual: true,
      source: "manual-ui",
      createdBy,
    });
  }
}

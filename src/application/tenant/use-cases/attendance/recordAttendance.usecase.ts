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
      let targetBranchId = input.branchId;

      if (!targetShiftId) {
        // Fetch active assignments using findAssignmentsByEmployee
        const assignments = await this.shiftRepository.findAssignmentsByEmployee(input.userId, input.tenantId);
        const userAssignment = assignments.find(
          (a: any) => a.endDate === null || a.endDate > new Date()
        );

        if (userAssignment) {
          targetShiftId = userAssignment.shiftId;
        } else {
          throw new Error("No se ha proporcionado un turno ni el empleado tiene un turno asignado por defecto.");
        }
      }

      const shift = await this.shiftRepository.findById(targetShiftId as string, input.tenantId);
      if (!shift) {
        throw new Error("El turno asignado no existe.");
      }

      let lateMinutes = 0;
      let extraMinutes = 0;

      if ((input.status === "present" || input.status === "late") && input.checkIn) {
        const scheduledStart = new Date(input.workDate);
        scheduledStart.setHours(shift.startTime.getHours(), shift.startTime.getMinutes(), 0, 0);

        if (input.checkIn > scheduledStart) {
          const delay = differenceInMinutes(input.checkIn, scheduledStart);
          if (delay > shift.toleranceMinutes) {
            lateMinutes = delay;
          }
        }
      }

      if (input.checkOut && shift.endTime) {
        const scheduledEnd = new Date(input.workDate);
        scheduledEnd.setHours(shift.endTime.getHours(), shift.endTime.getMinutes(), 0, 0);

        if (input.checkOut > scheduledEnd) {
          extraMinutes = differenceInMinutes(input.checkOut, scheduledEnd);
        }
      }

      let finalStatus = input.status;
      if (finalStatus !== "absent" && finalStatus !== "dayoff" && finalStatus !== "justified") {
        if (lateMinutes > 0 && finalStatus !== "manual") {
          finalStatus = "late";
        } else if (lateMinutes === 0 && finalStatus !== "manual") {
          finalStatus = "present";
        }
      }

      const existing = await this.attendanceRepository.findByEmployeeAndDate(
        input.tenantId,
        input.userId,
        input.workDate
      );

      if (existing) {
        const updateDto: UpdateAttendanceDTO = {
          checkIn: input.checkIn ?? existing.checkIn ?? undefined,
          checkOut: input.checkOut ?? existing.checkOut ?? undefined,
          notes: input.notes ?? existing.notes ?? undefined,
          status: finalStatus,
          lateMinutes,
          extraMinutes,
          isManual: input.isManual,
          justification: input.justification ?? existing.justification ?? undefined,
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
          notes: input.notes,
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
    workDate: Date,
    justification: string,
    createdBy: string
  ): Promise<AttendanceRecordDTO> {
    return this.execute({
      tenantId,
      userId,
      branchId: "all", 
      workDate,
      status: "justified",
      justification,
      isManual: true,
      source: "system",
      createdBy,
    });
  }
}

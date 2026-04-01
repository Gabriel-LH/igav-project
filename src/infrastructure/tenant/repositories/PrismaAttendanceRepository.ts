import {
  AttendanceRepository,
  AttendanceRecordDTO,
  CreateAttendanceDTO,
  UpdateAttendanceDTO,
} from "@/src/domain/tenant/repositories/AttendanceRepository";
import { Prisma } from "@/prisma/generated/client";

// Mapeo seguro del tipo del cliente Prisma, similar a otras implementaciones
type PrismaClientWithTx = any;

export class PrismaAttendanceRepository implements AttendanceRepository {
  constructor(private readonly prisma: PrismaClientWithTx) {}

  private mapToDTO(record: any): AttendanceRecordDTO {
    return {
      id: record.id,
      tenantId: record.tenantId,
      branchId: record.branchId,
      userId: record.userId,
      shiftId: record.shiftId,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      notes: record.notes,
      status: record.status,
      source: record.source,
      lateMinutes: record.lateMinutes,
      extraMinutes: record.extraMinutes,
      workDate: record.workDate,
      isManual: record.isManual,
      justification: record.justification,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy,
    };
  }

  async findWeeklyRecords(
    tenantId: string,
    branchId: string | "all",
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceRecordDTO[]> {
    const whereClause: Prisma.UserAttendanceWhereInput = {
      tenantId,
      workDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId !== "all") {
      whereClause.branchId = branchId;
    }

    const records = await this.prisma.userAttendance.findMany({
      where: whereClause,
      orderBy: { workDate: "asc" },
      include: {
        user: { select: { name: true, id: true } },
        shift: { select: { name: true } },
      },
    });

    return records.map((record: any) => {
      const dto = this.mapToDTO(record);
      // Podemos adjuntar la informacion extendida a un tipo que necesite la UI o devolver los datos crudos.
      return {
        ...dto,
        employeeName: record.user.name || "Desconocido",
        employeeDni: record.user.id || "00000000",
        shiftName: record.shift.name,
      } as unknown as AttendanceRecordDTO; // Cast to extend for Use Cases mapping
    });
  }

  async findByEmployeeAndDate(
    tenantId: string,
    employeeId: string,
    workDate: Date
  ): Promise<AttendanceRecordDTO | null> {
    const startOfDay = new Date(workDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    const record = await this.prisma.userAttendance.findFirst({
      where: {
        tenantId,
        userId: employeeId,
        workDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    return record ? this.mapToDTO(record) : null;
  }

  async upsertAttendance(
    recordId: string | null,
    dto: CreateAttendanceDTO,
    updateDto: UpdateAttendanceDTO
  ): Promise<AttendanceRecordDTO> {
    if (recordId) {
      return this.updateAttendance(recordId, updateDto);
    } else {
      return this.createAttendance(dto);
    }
  }

  async createAttendance(dto: CreateAttendanceDTO): Promise<AttendanceRecordDTO> {
    const record = await this.prisma.userAttendance.create({
      data: {
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        userId: dto.userId,
        shiftId: dto.shiftId,
        checkIn: dto.checkIn,
        checkOut: dto.checkOut,
        notes: dto.notes,
        status: dto.status,
        source: dto.source,
        lateMinutes: dto.lateMinutes || 0,
        extraMinutes: dto.extraMinutes || 0,
        workDate: dto.workDate,
        isManual: dto.isManual || false,
        justification: dto.justification,
        createdBy: dto.createdBy,
      },
    });
    return this.mapToDTO(record);
  }

  async updateAttendance(id: string, dto: UpdateAttendanceDTO): Promise<AttendanceRecordDTO> {
    const record = await this.prisma.userAttendance.update({
      where: { id },
      data: dto,
    });
    return this.mapToDTO(record);
  }
}

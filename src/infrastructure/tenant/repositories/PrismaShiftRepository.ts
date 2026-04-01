import { PrismaClient, Prisma } from "@/prisma/generated/client";
import {
  ShiftRepository,
  ShiftDTO,
  CreateShiftDTO,
  UpdateShiftDTO,
  ShiftAssignmentDTO,
  CreateShiftAssignmentDTO,
} from "@/src/domain/tenant/repositories/ShiftRepository";

// TransactionClient allows it to execute safely inside Prisma.transaction
type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class PrismaShiftRepository implements ShiftRepository {
  constructor(private readonly prisma: PrismaClient | TransactionClient) {}

  async findAll(tenantId: string): Promise<ShiftDTO[]> {
    const shifts = await this.prisma.shift.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    
    // Default to 'active' or 'inactive' to ensure it satisfies "active" | "inactive" type from Prisma's ShiftStatus wrapper
    return shifts.map(s => ({
      ...s,
      status: s.status as "active" | "inactive"
    }));
  }

  async findById(id: string, tenantId: string): Promise<ShiftDTO | null> {
    const shift = await this.prisma.shift.findUnique({
      where: { id, tenantId },
    });
    if (!shift) return null;
    return {
      ...shift,
      status: shift.status as "active" | "inactive"
    };
  }

  async create(data: CreateShiftDTO): Promise<ShiftDTO> {
    const shift = await this.prisma.shift.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        toleranceMinutes: data.toleranceMinutes,
        workingDays: data.workingDays,
        status: data.status || "active",
        createdBy: data.createdBy,
      },
    });
    return {
      ...shift,
      status: shift.status as "active" | "inactive"
    };
  }

  async update(id: string, tenantId: string, data: UpdateShiftDTO): Promise<ShiftDTO> {
    const shift = await this.prisma.shift.update({
      where: { id, tenantId },
      data,
    });
    return {
      ...shift,
      status: shift.status as "active" | "inactive"
    };
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.shift.delete({
      where: { id, tenantId },
    });
  }

  async findAssignmentsByShiftId(shiftId: string, tenantId: string): Promise<ShiftAssignmentDTO[]> {
    const assignments = await this.prisma.userShiftAssignment.findMany({
      where: { shiftId, tenantId },
      include: {
        membership: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { startDate: "desc" }
    });

    return assignments.map(a => ({
      ...a,
      memberName: a.membership?.user?.name
    }));
  }

  async findAssignmentsByEmployee(employeeId: string, tenantId: string): Promise<ShiftAssignmentDTO[]> {
    const assignments = await this.prisma.userShiftAssignment.findMany({
      where: { membershipId: employeeId, tenantId },
      include: {
        membership: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { startDate: "desc" }
    });

    return assignments.map(a => ({
      ...a,
      memberName: a.membership?.user?.name
    }));
  }

  async createAssignment(data: CreateShiftAssignmentDTO): Promise<ShiftAssignmentDTO> {
    const assignment = await this.prisma.userShiftAssignment.create({
      data: {
        tenantId: data.tenantId,
        membershipId: data.membershipId,
        shiftId: data.shiftId,
        startDate: data.startDate,
        endDate: data.endDate as any,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
      },
      include: {
        membership: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    return {
      ...assignment,
      memberName: (assignment as any).membership?.user?.name
    };
  }

  async deleteAssignment(id: string, tenantId: string): Promise<void> {
    await this.prisma.userShiftAssignment.delete({
      where: { id, tenantId },
    });
  }
}

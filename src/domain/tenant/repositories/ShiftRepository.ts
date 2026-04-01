// src/domain/tenant/repositories/ShiftRepository.ts

export interface ShiftDTO {
  id: string;
  tenantId: string;
  name: string;
  startTime: Date;
  endTime: Date | null;
  toleranceMinutes: number;
  workingDays: number[];
  status: "active" | "inactive";
  createdAt: Date;
  createdBy: string | null;
}

export interface ShiftAssignmentDTO {
  id: string;
  tenantId: string;
  membershipId: string;
  shiftId: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  // Extended fields for UI convenience
  memberName?: string;
}

export interface CreateShiftDTO {
  tenantId: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  toleranceMinutes: number;
  workingDays: number[];
  createdBy?: string;
  status?: "active" | "inactive";
}

export interface UpdateShiftDTO {
  name?: string;
  startTime?: Date;
  endTime?: Date;
  toleranceMinutes?: number;
  workingDays?: number[];
  status?: "active" | "inactive";
}

export interface CreateShiftAssignmentDTO {
  tenantId: string;
  membershipId: string;
  shiftId: string;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
  updatedBy: string;
}

export interface ShiftRepository {
  // Shifts
  findAll(tenantId: string): Promise<ShiftDTO[]>;
  findById(id: string, tenantId: string): Promise<ShiftDTO | null>;
  create(data: CreateShiftDTO): Promise<ShiftDTO>;
  update(id: string, tenantId: string, data: UpdateShiftDTO): Promise<ShiftDTO>;
  delete(id: string, tenantId: string): Promise<void>;

  // Assignments
  findAssignmentsByShiftId(shiftId: string, tenantId: string): Promise<ShiftAssignmentDTO[]>;
  findAssignmentsByEmployee(employeeId: string, tenantId: string): Promise<ShiftAssignmentDTO[]>;
  createAssignment(data: CreateShiftAssignmentDTO): Promise<ShiftAssignmentDTO>;
  deleteAssignment(id: string, tenantId: string): Promise<void>;
}

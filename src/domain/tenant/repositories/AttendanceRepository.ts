export interface AttendanceRecordDTO {
  id: string;
  tenantId: string;
  branchId: string;
  userId: string;
  shiftId: string;
  checkIn: Date | null;
  checkOut: Date | null;
  notes: string | null;
  status: string;
  source: string;
  lateMinutes: number;
  extraMinutes: number;
  workDate: Date;
  isManual: boolean;
  justification: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateAttendanceDTO {
  tenantId: string;
  branchId: string;
  userId: string;
  shiftId: string;
  checkIn?: Date;
  checkOut?: Date;
  notes?: string;
  status: string;
  source: string;
  lateMinutes?: number;
  extraMinutes?: number;
  workDate: Date;
  isManual?: boolean;
  justification?: string;
  createdBy: string;
}

export interface UpdateAttendanceDTO {
  checkIn?: Date;
  checkOut?: Date;
  notes?: string;
  status?: string;
  source?: string;
  lateMinutes?: number;
  extraMinutes?: number;
  isManual?: boolean;
  justification?: string;
}

export interface AttendanceRepository {
  /**
   * Find attendance records for a specific branch and date range
   */
  findWeeklyRecords(
    tenantId: string,
    branchId: string | "all",
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceRecordDTO[]>;

  /**
   * Find a specific attendance record for an employee on a given working date
   */
  findByEmployeeAndDate(
    tenantId: string,
    employeeId: string,
    workDate: Date
  ): Promise<AttendanceRecordDTO | null>;

  /**
   * Mark attendance (Create or Update)
   */
  upsertAttendance(
    recordId: string | null,
    dto: CreateAttendanceDTO,
    updateDto: UpdateAttendanceDTO
  ): Promise<AttendanceRecordDTO>;

  createAttendance(dto: CreateAttendanceDTO): Promise<AttendanceRecordDTO>;
  
  updateAttendance(id: string, dto: UpdateAttendanceDTO): Promise<AttendanceRecordDTO>;
}

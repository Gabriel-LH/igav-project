// types/shift.types.ts
export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  workingDays: WorkingDay[];
  toleranceMinutes: number;
  allowOvertime: boolean;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingDay {
  day: "L" | "M" | "X" | "J" | "V" | "S" | "D";
  label: string;
  active: boolean;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  startDate: Date;
  endDate?: Date;
  status: "active" | "inactive";
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  membership: string;
}

// types/payroll.types.ts
export interface Employee {
  id: string;
  name: string;
  email: string;
  membership: string;
  department: string;
  hireDate: Date;
}

export interface PayrollConfig {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "mensual" | "por_hora";
  baseSalary: number;
  hourlyRate?: number;
  overtimeRate: number; // Multiplicador (ej: 1.5 para 50% extra)
  automaticDeductions: {
    healthInsurance: boolean;
    pension: boolean;
    taxes: boolean;
    otherDeductions?: number;
  };
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: Date;
  checkIn: Date;
  checkOut: Date;
  regularHours: number;
  overtimeHours: number;
  lateMinutes: number;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  period: {
    month: number;
    year: number;
  };
  config: PayrollConfig;
  calculations: {
    baseAmount: number;
    overtimeAmount: number;
    deductions: {
      healthInsurance: number;
      pension: number;
      taxes: number;
      others: number;
      total: number;
    };
    total: number;
  };
  summary: {
    daysWorked: number;
    regularHours: number;
    overtimeHours: number;
    lateMinutes: number;
  };
  status: "draft" | "calculated" | "paid";
  generatedAt: Date;
  paidAt?: Date;
}

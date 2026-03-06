export interface PayrollEmployee {
  id: string;
  name: string;
  email: string;
  membership: string;
  department: string;
  hireDate: Date;
}

export interface PayrollConfigView {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "mensual" | "por_hora";
  baseSalary: number;
  hourlyRate?: number;
  applyOvertime: boolean;
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

export interface PayrollView {
  id: string;
  employeeId: string;
  employeeName: string;
  period: {
    month: number;
    year: number;
  };
  config: PayrollConfigView;
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

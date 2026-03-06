import type {
  PayrollEmployee,
  PayrollView,
  PayrollConfigView,
} from "../types/payroll/type.payrollView";
import { PAYROLL_CONFIGS_MOCK } from "./mock.payrollConfig";
import { PAYROLL_ITEMS_MOCK } from "./mock.payrollItem";
import { PAYROLL_LINE_ITEMS_MOCK } from "./mock.payrollLineItem";
import { PAYROLL_POLICIES_MOCK } from "./mock.payrollPolicy";
import { PAYROLL_RUNS_MOCK } from "./mock.payrollRun";

export const PAYROLL_EMPLOYEES_MOCK: PayrollEmployee[] = [
  {
    id: "u-1",
    name: "Juan Pérez",
    email: "juan@empresa.com",
    membership: "EMP001",
    department: "Ventas",
    hireDate: new Date("2023-01-15"),
  },
  {
    id: "u-2",
    name: "María García",
    email: "maria@empresa.com",
    membership: "EMP002",
    department: "Marketing",
    hireDate: new Date("2023-02-20"),
  },
  {
    id: "u-3",
    name: "Carlos López",
    email: "carlos@empresa.com",
    membership: "EMP003",
    department: "IT",
    hireDate: new Date("2023-03-10"),
  },
  {
    id: "u-4",
    name: "Ana Martínez",
    email: "ana@empresa.com",
    membership: "EMP004",
    department: "RRHH",
    hireDate: new Date("2023-04-05"),
  },
];

const attendanceSummaryByMembership: Record<
  string,
  { daysWorked: number; regularHours: number; overtimeHours: number; lateMinutes: number }
> = {
  EMP001: { daysWorked: 22, regularHours: 176, overtimeHours: 5, lateMinutes: 45 },
  EMP002: { daysWorked: 22, regularHours: 176, overtimeHours: 0, lateMinutes: 0 },
  EMP003: { daysWorked: 21, regularHours: 168, overtimeHours: 8, lateMinutes: 15 },
  EMP004: { daysWorked: 22, regularHours: 176, overtimeHours: 6, lateMinutes: 30 },
};

const membershipToEmployee = new Map(
  PAYROLL_EMPLOYEES_MOCK.map((employee) => [employee.membership, employee]),
);

const firstPolicy = PAYROLL_POLICIES_MOCK[0];

export const PAYROLL_CONFIGS_VIEW_MOCK: PayrollConfigView[] = PAYROLL_CONFIGS_MOCK.map(
  (config) => {
    const employee = membershipToEmployee.get(config.membershipId);
    return {
      id: config.id,
      employeeId: employee?.id ?? config.membershipId,
      employeeName: employee?.name ?? config.membershipId,
      type: config.salaryType === "monthly" ? "mensual" : "por_hora",
      baseSalary: config.baseSalary ?? 0,
      hourlyRate: config.hourlyRate,
      applyOvertime: config.applyOvertime,
      automaticDeductions: {
        healthInsurance: firstPolicy.deductions.healthInsurancePercent > 0,
        pension: firstPolicy.deductions.pensionPercent > 0,
        taxes: firstPolicy.deductions.taxPercent > 0,
        otherDeductions: 0,
      },
      status: "active",
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  },
);

const mapStatus = (status: string): PayrollView["status"] => {
  if (status === "paid") return "paid";
  if (status === "calculated") return "calculated";
  return "draft";
};

export const PAYROLLS_VIEW_MOCK: PayrollView[] = PAYROLL_ITEMS_MOCK.map((item) => {
  const employee = membershipToEmployee.get(item.membershipId);
  const run = PAYROLL_RUNS_MOCK.find((payrollRun) => payrollRun.id === item.payrollRunId);
  const config = PAYROLL_CONFIGS_VIEW_MOCK.find(
    (payrollConfig) => payrollConfig.employeeId === employee?.id,
  );
  const lineItems = PAYROLL_LINE_ITEMS_MOCK.filter(
    (lineItem) => lineItem.payrollItemId === item.id,
  );

  const baseAmount = lineItems
    .filter((lineItem) => lineItem.category === "salary" || lineItem.category === "hourly")
    .reduce((acc, lineItem) => acc + lineItem.amount, 0);

  const overtimeAmount = lineItems
    .filter((lineItem) => lineItem.category === "overtime")
    .reduce((acc, lineItem) => acc + lineItem.amount, 0);

  const healthInsurance = lineItems
    .filter((lineItem) => lineItem.category === "health_insurance")
    .reduce((acc, lineItem) => acc + lineItem.amount, 0);

  const pension = lineItems
    .filter((lineItem) => lineItem.category === "pension")
    .reduce((acc, lineItem) => acc + lineItem.amount, 0);

  const taxes = lineItems
    .filter((lineItem) => lineItem.category === "tax")
    .reduce((acc, lineItem) => acc + lineItem.amount, 0);

  const others = lineItems
    .filter((lineItem) =>
      ["advance", "penalty", "adjustment"].includes(lineItem.category),
    )
    .reduce((acc, lineItem) => acc + lineItem.amount, 0);

  return {
    id: item.id,
    employeeId: employee?.id ?? item.membershipId,
    employeeName: employee?.name ?? item.membershipId,
    period: {
      month: (run?.payDate ?? new Date()).getMonth() + 1,
      year: (run?.payDate ?? new Date()).getFullYear(),
    },
    config: config ?? PAYROLL_CONFIGS_VIEW_MOCK[0],
    calculations: {
      baseAmount,
      overtimeAmount,
      deductions: {
        healthInsurance,
        pension,
        taxes,
        others,
        total: item.deductionTotal,
      },
      total: item.netTotal,
    },
    summary: attendanceSummaryByMembership[item.membershipId] ?? {
      daysWorked: 0,
      regularHours: 0,
      overtimeHours: 0,
      lateMinutes: 0,
    },
    status: mapStatus(item.status),
    generatedAt: run?.createdAt ?? new Date(),
    paidAt: item.status === "paid" ? run?.payDate : undefined,
  };
});

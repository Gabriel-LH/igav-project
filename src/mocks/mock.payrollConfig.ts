import { PayrollConfig } from "../types/payroll/type.payrollConfig";

export const PAYROLL_CONFIGS_MOCK: PayrollConfig[] = [
  {
    id: "pc-1",
    membershipId: "EMP001",
    salaryType: "monthly",
    baseSalary: 3200,
    paySchedule: "monthly",
    applyOvertime: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "pc-2",
    membershipId: "EMP002",
    salaryType: "monthly",
    baseSalary: 2800,
    paySchedule: "monthly",
    applyOvertime: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "pc-3",
    membershipId: "EMP003",
    salaryType: "hourly",
    hourlyRate: 25,
    paySchedule: "monthly",
    applyOvertime: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "pc-4",
    membershipId: "EMP004",
    salaryType: "hourly",
    hourlyRate: 18,
    paySchedule: "monthly",
    applyOvertime: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
];

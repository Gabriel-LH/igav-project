import { PayrollRun } from "../types/payroll/type.payrollRun";

export const PAYROLL_RUNS_MOCK: PayrollRun[] = [
  {
    id: "pr-2026-02-main",
    branchId: "branch-main",
    periodStart: new Date("2026-02-01"),
    periodEnd: new Date("2026-02-28"),
    payDate: new Date("2026-02-28"),
    status: "paid",
    createdAt: new Date("2026-02-28"),
  },
];

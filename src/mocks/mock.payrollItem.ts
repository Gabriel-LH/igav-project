import { PayrollItem } from "../types/payroll/type.payrollItem";

export const PAYROLL_ITEMS_MOCK: PayrollItem[] = [
  {
    id: "pi-1",
    payrollRunId: "pr-2026-02-main",
    membershipId: "EMP001",
    grossTotal: 3330,
    deductionTotal: 742.5,
    netTotal: 2587.5,
    status: "paid",
  },
  {
    id: "pi-2",
    payrollRunId: "pr-2026-02-main",
    membershipId: "EMP002",
    grossTotal: 2800,
    deductionTotal: 630,
    netTotal: 2170,
    status: "paid",
  },
  {
    id: "pi-3",
    payrollRunId: "pr-2026-02-main",
    membershipId: "EMP003",
    grossTotal: 4500,
    deductionTotal: 1035,
    netTotal: 3465,
    status: "paid",
  },
  {
    id: "pi-4",
    payrollRunId: "pr-2026-02-main",
    membershipId: "EMP004",
    grossTotal: 3321,
    deductionTotal: 745.95,
    netTotal: 2575.05,
    status: "paid",
  },
];

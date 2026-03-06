import { PayrollPolicy } from "../types/payroll/type.payrollPolicies";

export const PAYROLL_POLICIES_MOCK: PayrollPolicy[] = [
  {
    id: "pp-1",
    tenantId: "tenant-a",
    deductions: {
      healthInsurancePercent: 5,
      pensionPercent: 10,
      taxPercent: 7.5,
    },
    overtimeMultiplier: 1.5,
    updatedAt: new Date("2026-01-01"),
  },
];

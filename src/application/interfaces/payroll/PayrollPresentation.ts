import type { PayrollConfig } from "@/src/types/payroll/type.payrollConfig";
import type { PayrollItem } from "@/src/types/payroll/type.payrollItem";
import type { PayrollLineItem } from "@/src/types/payroll/type.payrollLineItem";
import type { PayrollRun } from "@/src/types/payroll/type.payrollRun";

export interface PayrollMemberOption {
  membershipId: string;
  displayName: string;
}

export const PAYROLL_MEMBER_OPTIONS: PayrollMemberOption[] = [
  { membershipId: "EMP001", displayName: "Empleado 001" },
  { membershipId: "EMP002", displayName: "Empleado 002" },
  { membershipId: "EMP003", displayName: "Empleado 003" },
  { membershipId: "EMP004", displayName: "Empleado 004" },
];

export function getPayrollMemberName(membershipId: string): string {
  return (
    PAYROLL_MEMBER_OPTIONS.find((m) => m.membershipId === membershipId)
      ?.displayName ?? membershipId
  );
}

export interface PayrollConfigListItemDTO {
  id: string;
  membershipId: string;
  employeeName: string;
  salaryType: PayrollConfig["salaryType"];
  paySchedule: PayrollConfig["paySchedule"];
  compensationLabel: string;
  applyOvertime: boolean;
  updatedAt: Date;
}

export interface PayrollItemListItemDTO {
  id: string;
  payrollRunId: string;
  membershipId: string;
  employeeName: string;
  periodLabel: string;
  payDate: Date;
  status: PayrollItem["status"];
  grossTotal: number;
  deductionTotal: number;
  netTotal: number;
}

export interface PayrollItemDetailDTO extends PayrollItemListItemDTO {
  periodStart: Date;
  periodEnd: Date;
  lineItems: PayrollLineItem[];
}

export interface GeneratedPayrollBatchDTO {
  run: PayrollRun;
  items: PayrollItem[];
  lineItems: PayrollLineItem[];
}


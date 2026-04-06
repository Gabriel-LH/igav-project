import { PayrollConfig } from "@/src/types/payroll/type.payrollConfig";
import { PayrollItem } from "@/src/types/payroll/type.payrollItem";
import { PayrollLineItem } from "@/src/types/payroll/type.payrollLineItem";
import { PayrollPolicy } from "@/src/types/payroll/type.payrollPolicies";
import { PayrollRun } from "@/src/types/payroll/type.payrollRun";

export interface CreatePayrollPolicyDTO {
  tenantId: string;
  deductions: {
    healthInsurancePercent: number;
    pensionPercent: number;
    taxPercent: number;
  };
  overtimeMultiplier: number;
  createdBy: string;
}

export interface UpdatePayrollPolicyDTO {
  deductions?: {
    healthInsurancePercent: number;
    pensionPercent: number;
    taxPercent: number;
  };
  overtimeMultiplier?: number;
  updatedBy: string;
}

export interface CreatePayrollConfigDTO {
  tenantId: string;
  membershipId: string;
  salaryType: "monthly" | "hourly";
  baseSalary?: number;
  hourlyRate?: number;
  paySchedule: string;
  applyOvertime: boolean;
  applyHealthInsurance: boolean;
  applyPension: boolean;
  applyTax: boolean;
  otherDeductions: number;
  createdBy: string;
}

export interface UpdatePayrollConfigDTO {
  salaryType?: "monthly" | "hourly";
  baseSalary?: number;
  hourlyRate?: number;
  paySchedule?: string;
  applyOvertime?: boolean;
  applyHealthInsurance?: boolean;
  applyPension?: boolean;
  applyTax?: boolean;
  otherDeductions?: number;
  updatedBy: string;
}

export interface CreatePayrollRunDTO {
  tenantId: string;
  branchId: string;
  periodStart: Date;
  periodEnd: Date;
  payDate: Date;
  status: string;
  items: {
    membershipId: string;
    grossTotal: number;
    deductionTotal: number;
    netTotal: number;
    status: string;
    lineItems: {
      type: string;
      category: string;
      name: string;
      amount: number;
      quantity?: number;
      rate?: number;
    }[];
  }[];
}

export interface PayrollRepository {
  // Policy
  findPolicy(tenantId: string): Promise<PayrollPolicy | null>;
  upsertPolicy(dto: CreatePayrollPolicyDTO): Promise<PayrollPolicy>;

  // Config
  findConfigs(tenantId: string): Promise<PayrollConfig[]>;
  saveConfig(dto: CreatePayrollConfigDTO): Promise<PayrollConfig>;
  updateConfig(id: string, dto: UpdatePayrollConfigDTO): Promise<PayrollConfig>;

  // Runs & Items
  createRun(dto: CreatePayrollRunDTO): Promise<PayrollRun>;
  findRuns(tenantId: string): Promise<PayrollRun[]>;
  findItemsByRun(runId: string): Promise<PayrollItem[]>;
  findLineItemsByItem(itemId: string): Promise<PayrollLineItem[]>;
}

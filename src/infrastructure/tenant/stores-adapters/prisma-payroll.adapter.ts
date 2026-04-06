import { 
  PayrollRepository, 
  CreatePayrollPolicyDTO, 
  CreatePayrollConfigDTO, 
  UpdatePayrollConfigDTO, 
  CreatePayrollRunDTO 
} from "@/src/domain/tenant/repositories/PayrollRepository";
import prisma from "@/src/lib/prisma";
import { PayrollPolicy } from "@/src/types/payroll/type.payrollPolicies";
import { PayrollConfig } from "@/src/types/payroll/type.payrollConfig";
import { PayrollRun } from "@/src/types/payroll/type.payrollRun";
import { PayrollItem } from "@/src/types/payroll/type.payrollItem";
import { PayrollLineItem } from "@/src/types/payroll/type.payrollLineItem";

export class PrismaPayrollAdapter implements PayrollRepository {
  // Policy
  async findPolicy(tenantId: string): Promise<PayrollPolicy | null> {
    const raw = await prisma.payrollPolicy.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    if (!raw) return null;

    return {
      ...raw,
      deductions: raw.deductions as any, // Cast from Json
    } as PayrollPolicy;
  }

  async upsertPolicy(dto: CreatePayrollPolicyDTO): Promise<PayrollPolicy> {
    const current = await this.findPolicy(dto.tenantId);

    if (current) {
      const updated = await prisma.payrollPolicy.update({
        where: { id: current.id },
        data: {
          deductions: dto.deductions as any,
          overtimeMultiplier: dto.overtimeMultiplier,
          updatedBy: dto.createdBy, // We use createdBy as current user in simple mode
        },
      });
      return { ...updated, deductions: updated.deductions as any } as PayrollPolicy;
    }

    const created = await prisma.payrollPolicy.create({
      data: {
        tenantId: dto.tenantId,
        deductions: dto.deductions as any,
        overtimeMultiplier: dto.overtimeMultiplier,
        createdBy: dto.createdBy,
        updatedBy: dto.createdBy,
      },
    });

    return { ...created, deductions: created.deductions as any } as PayrollPolicy;
  }

  // Config
  async findConfigs(tenantId: string): Promise<PayrollConfig[]> {
    const configs = await prisma.payrollConfig.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return configs as any[];
  }

  async saveConfig(dto: CreatePayrollConfigDTO): Promise<PayrollConfig> {
    const created = await prisma.payrollConfig.create({
      data: {
        tenantId: dto.tenantId,
        membershipId: dto.membershipId,
        salaryType: dto.salaryType,
        baseSalary: dto.baseSalary ?? 0,
        hourlyRate: dto.hourlyRate ?? 0,
        paySchedule: dto.paySchedule as any,
        applyOvertime: dto.applyOvertime,
        applyHealthInsurance: dto.applyHealthInsurance,
        applyPension: dto.applyPension,
        applyTax: dto.applyTax,
        otherDeductions: dto.otherDeductions,
        createdBy: dto.createdBy,
        updatedBy: dto.createdBy,
      },
    });

    return created as any;
  }

  async updateConfig(id: string, dto: UpdatePayrollConfigDTO): Promise<PayrollConfig> {
    const updated = await prisma.payrollConfig.update({
      where: { id },
      data: {
        salaryType: dto.salaryType,
        baseSalary: dto.baseSalary,
        hourlyRate: dto.hourlyRate,
        paySchedule: dto.paySchedule as any,
        applyOvertime: dto.applyOvertime,
        applyHealthInsurance: dto.applyHealthInsurance,
        applyPension: dto.applyPension,
        applyTax: dto.applyTax,
        otherDeductions: dto.otherDeductions,
        updatedBy: dto.updatedBy,
      },
    });

    return updated as any;
  }

  // Runs & History
  async createRun(dto: CreatePayrollRunDTO): Promise<PayrollRun> {
    // We use a transaction to create the run and all items
    const result = await prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          payDate: dto.payDate,
          status: dto.status as any,
        },
      });

      for (const itemDto of dto.items) {
        const item = await tx.payrollItem.create({
          data: {
            tenantId: dto.tenantId,
            payrollRunId: run.id,
            membershipId: itemDto.membershipId,
            grossTotal: itemDto.grossTotal,
            deductionTotal: itemDto.deductionTotal,
            netTotal: itemDto.netTotal,
            status: itemDto.status as any,
          },
        });

        await tx.payrollLineItem.createMany({
          data: itemDto.lineItems.map((li) => ({
            tenantId: dto.tenantId,
            payrollItemId: item.id,
            type: li.type as any,
            category: li.category as any,
            name: li.name,
            amount: li.amount,
            quantity: li.quantity,
            rate: li.rate,
          })),
        });
      }

      return run;
    });

    return result as any;
  }

  async findRuns(tenantId: string): Promise<PayrollRun[]> {
    const runs = await prisma.payrollRun.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return runs as any[];
  }

  async findItemsByRun(runId: string): Promise<PayrollItem[]> {
    const items = await prisma.payrollItem.findMany({
      where: { payrollRunId: runId },
    });
    return items as any[];
  }

  async findLineItemsByItem(itemId: string): Promise<PayrollLineItem[]> {
    const lines = await prisma.payrollLineItem.findMany({
      where: { payrollItemId: itemId },
    });
    return lines as any[];
  }
}

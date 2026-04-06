"use server";

import { revalidatePath } from "next/cache";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaPayrollAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-payroll.adapter";
import prisma from "@/src/lib/prisma";
import { 
  CreatePayrollConfigDTO,
  UpdatePayrollConfigDTO 
} from "@/src/domain/tenant/repositories/PayrollRepository";
import { GeneratedPayrollBatchDTO } from "@/src/application/interfaces/payroll/PayrollPresentation";

const payrollAdapter = new PrismaPayrollAdapter();

async function getContext() {
  const membership = await requireTenantMembership();
  if (!membership.tenantId) throw new Error("No tenant associated");
  if (!membership.user.id) throw new Error("User ID not found");
  
  return {
    tenantId: membership.tenantId,
    userId: membership.user.id as string,
  };
}

export async function getPayrollDataAction() {
  const { tenantId } = await getContext();
  
  const [policy, configs, runs, payrolls, lineItems] = await Promise.all([
    payrollAdapter.findPolicy(tenantId),
    payrollAdapter.findConfigs(tenantId),
    payrollAdapter.findRuns(tenantId),
    prisma.payrollItem.findMany({ where: { tenantId } }),
    prisma.payrollLineItem.findMany({ where: { tenantId } }),
  ]);

  return { policy, configs, runs, payrolls, lineItems };
}

export async function savePayrollPolicyAction(data: {
  healthInsurancePercent: number;
  pensionPercent: number;
  taxPercent: number;
  overtimeMultiplier: number;
}) {
  const { tenantId, userId } = await getContext();

  const result = await payrollAdapter.upsertPolicy({
    tenantId,
    deductions: {
      healthInsurancePercent: data.healthInsurancePercent,
      pensionPercent: data.pensionPercent,
      taxPercent: data.taxPercent,
    },
    overtimeMultiplier: data.overtimeMultiplier,
    createdBy: userId,
  });

  revalidatePath("/tenant/payroll");
  return result;
}

export async function savePayrollConfigAction(data: Omit<CreatePayrollConfigDTO, "tenantId" | "createdBy">) {
  const { tenantId, userId } = await getContext();

  const result = await payrollAdapter.saveConfig({
    ...data,
    tenantId,
    createdBy: userId,
  });

  revalidatePath("/tenant/payroll");
  return result;
}

export async function updatePayrollConfigAction(id: string, data: Omit<UpdatePayrollConfigDTO, "updatedBy">) {
  const { userId } = await getContext();

  const result = await payrollAdapter.updateConfig(id, {
    ...data,
    updatedBy: userId,
  });

  revalidatePath("/tenant/payroll");
  return result;
}

export async function generatePayrollRunAction(batch: GeneratedPayrollBatchDTO) {
  const { tenantId } = await getContext();

  const result = await payrollAdapter.createRun({
    tenantId,
    branchId: batch.run.branchId,
    periodStart: batch.run.periodStart,
    periodEnd: batch.run.periodEnd,
    payDate: batch.run.payDate,
    status: batch.run.status,
    items: batch.items.map(item => ({
      membershipId: item.membershipId,
      grossTotal: item.grossTotal,
      deductionTotal: item.deductionTotal,
      netTotal: item.netTotal,
      status: item.status,
      lineItems: batch.lineItems
        .filter(li => li.payrollItemId === item.id)
        .map(li => ({
          type: li.type,
          category: li.category,
          name: li.name,
          amount: li.amount,
          quantity: li.quantity,
          rate: li.rate,
        })),
    })),
  });

  revalidatePath("/tenant/payroll");
  return result;
}

export async function getPayrollItemsAction(runId: string) {
  const items = await payrollAdapter.findItemsByRun(runId);
  return items;
}

export async function getPayrollLineItemsAction(itemId: string) {
  const lines = await payrollAdapter.findLineItemsByItem(itemId);
  return lines;
}

export async function getPayrollMembersAction() {
  const { tenantId } = await getContext();
  const { default: prisma } = await import("@/src/lib/prisma");

  const memberships = await prisma.userTenantMembership.findMany({
    where: { tenantId, status: "active" },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return memberships.map(m => ({
    membershipId: m.id,
    userId: m.userId,
    displayName: m.user.name,
    email: m.user.email,
  }));
}

export async function getPayrollAttendanceSummaryAction(
  periodStart: Date,
  periodEnd: Date,
  branchId?: string,
) {
  const { tenantId } = await getContext();

  const memberships = await prisma.userTenantMembership.findMany({
    where: {
      tenantId,
      status: "active",
    },
    select: {
      id: true,
      userId: true,
    },
  });

  const membershipByUserId = new Map(
    memberships.map((membership) => [membership.userId, membership.id]),
  );

  const attendanceRecords = await prisma.userAttendance.findMany({
    where: {
      tenantId,
      workDate: {
        gte: periodStart,
        lte: periodEnd,
      },
      ...(branchId ? { branchId } : {}),
    },
    select: {
      userId: true,
      status: true,
      lateMinutes: true,
    },
  });

  const summaryByMembershipId = new Map<
    string,
    {
      membershipId: string;
      absentCount: number;
      justifiedCount: number;
      lateCount: number;
      lateMinutes: number;
    }
  >();

  for (const record of attendanceRecords) {
    const membershipId = membershipByUserId.get(record.userId);
    if (!membershipId) continue;

    const current = summaryByMembershipId.get(membershipId) ?? {
      membershipId,
      absentCount: 0,
      justifiedCount: 0,
      lateCount: 0,
      lateMinutes: 0,
    };

    if (record.status === "absent") {
      current.absentCount += 1;
    }

    if (record.status === "justified") {
      current.justifiedCount += 1;
    }

    if (record.status === "late") {
      current.lateCount += 1;
      current.lateMinutes += record.lateMinutes ?? 0;
    }

    summaryByMembershipId.set(membershipId, current);
  }

  return Array.from(summaryByMembershipId.values());
}

export async function updatePayrollItemStatusAction(itemId: string, status: string) {
  const { tenantId } = await getContext();
  const { default: prisma } = await import("@/src/lib/prisma");

  const result = await prisma.payrollItem.update({
    where: { id: itemId, tenantId },
    data: { 
      status: status as any,
    },
  });

  revalidatePath("/tenant/payroll");
  return result;
}

export async function deletePayrollItemAction(itemId: string) {
  const { tenantId } = await getContext();
  const { default: prisma } = await import("@/src/lib/prisma");

  const payrollItem = await prisma.payrollItem.findFirst({
    where: { id: itemId, tenantId },
    select: {
      id: true,
      payrollRunId: true,
    },
  });

  if (!payrollItem) {
    throw new Error("La planilla no existe o no pertenece a este tenant.");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.payrollItem.delete({
      where: { id: payrollItem.id },
    });

    const remainingItems = await tx.payrollItem.count({
      where: {
        tenantId,
        payrollRunId: payrollItem.payrollRunId,
      },
    });

    let deletedRunId: string | null = null;

    if (remainingItems === 0) {
      await tx.payrollRun.delete({
        where: { id: payrollItem.payrollRunId },
      });
      deletedRunId = payrollItem.payrollRunId;
    }

    return {
      deletedItemId: payrollItem.id,
      deletedRunId,
    };
  });

  revalidatePath("/tenant/payroll");
  return result;
}

"use server";

import { requireSuperAdmin } from "@/src/infrastructure/superadmin/auth.guard";
import { CrudTenantUseCase } from "@/src/application/superadmin/use-cases/tenant/crudTenant.usecase";
import { CrudPlanUseCase } from "@/src/application/superadmin/use-cases/plan/crudPlan.usecase";
import { BillingCycle } from "@/prisma/generated/client";
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/src/lib/prisma";

const tenantUseCase = new CrudTenantUseCase();
const planUseCase = new CrudPlanUseCase();

function isDecimal(value: any): value is { toNumber: () => number } {
  return !!value && typeof value === "object" && typeof value.toNumber === "function";
}

function toNumber(value: any): number {
  if (isDecimal(value)) return value.toNumber();
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  if (typeof value === "string" && value.trim() === "") return 0;
  return Number(value);
}

function toPlain(value: any): any {
  if (value === null || value === undefined) return value;
  if (isDecimal(value)) return value.toNumber();
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "object") {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = toPlain(val);
    }
    return result;
  }
  return value;
}

function normalizePlan(plan: any) {
  return {
    ...plan,
    priceMonthly: plan?.priceMonthly !== undefined ? toNumber(plan.priceMonthly) : 0,
    priceYearly: plan?.priceYearly !== undefined ? toNumber(plan.priceYearly) : 0,
  };
}

export async function getTenantsDashboardData() {
  await requireSuperAdmin();

  const tenants = toPlain(await tenantUseCase.executeFindAll());
  const rawPlans = await planUseCase.executeFindAll();

  // Convert Prisma Decimal objects to plain numbers for Next.js Client Component serialization
  const plans = rawPlans.map((plan) => normalizePlan(toPlain(plan)));

  const subscriptions = toPlain(
    await prisma.tenantSubscription.findMany({
      include: { tenant: true, plan: true },
      orderBy: { createdAt: "desc" },
    }),
  );

  return {
    tenants,
    plans,
    subscriptions: subscriptions.map((s) => ({
      ...s as any,
      trialEndsAt: (s as any).trialEndsAt || undefined,
      externalSubscriptionId: (s as any).externalSubscriptionId || undefined,
    })) as TenantSubscription[],
  };
}

export async function getTenantDetails(tenantId: string) {
  await requireSuperAdmin();

  const tenant = toPlain(await tenantUseCase.executeFindById(tenantId));
  if (!tenant) {
    return null;
  }

  // Find active subscription
  const subscription =
    tenant.tenantSubscriptions?.find((s: any) => s.status === "active") || null;


  let plan = null;
  if (subscription) {
    const rawPlan = await planUseCase.executeFindById(subscription.planId);
    if (rawPlan) {
      plan = normalizePlan(toPlain(rawPlan));
    }
  }

  // TODO: Use real usage DB stats later
  const mockUsage = {
    users: { used: 8, limit: 10 },
    branches: { used: 3, limit: 5 },
    products: { used: 240, limit: 500 },
    clients: { used: 45, limit: 100 },
  };

  return {
    tenant,
    subscription,
    plan,
    usage: mockUsage,
  };
}

export async function assignPlan(tenantId: string, planId: string, billingCycle: BillingCycle) {
  await requireSuperAdmin();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const now = new Date();
  const oneMonthMatch = billingCycle === "monthly" ? 1 : 12;
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + oneMonthMatch);

  const subscription = await prisma.$transaction(async (tx) => {
    await tx.tenantSubscription.updateMany({
      where: {
        tenantId,
        status: { in: ["trial", "active", "past_due"] },
      },
      data: {
        status: "canceled",
        currentPeriodEnd: now,
      },
    });

    const created = await tx.tenantSubscription.create({
      data: {
        tenantId,
        planId,
        status: "active",
        billingCycle,
        startedAt: now,
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        provider: "manual",
        createdBy: session?.user.id,
      },
    });

    await tx.tenant.update({
      where: { id: tenantId },
      data: { currentSubscriptionId: created.id },
    });

    return created;
  });

  revalidatePath("/superadmin/tenants");
  revalidatePath("/superadmin/subscriptions");
  
  return subscription;
}

export async function changeTenantPlan(
  tenantId: string,
  planId: string,
  billingCycle: BillingCycle,
) {
  await requireSuperAdmin();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + (billingCycle === "monthly" ? 1 : 12));

  await prisma.$transaction(async (tx) => {
    await tx.tenantSubscription.updateMany({
      where: {
        tenantId,
        status: { in: ["trial", "active", "past_due"] },
      },
      data: {
        status: "canceled",
        currentPeriodEnd: now,
      },
    });

    const created = await tx.tenantSubscription.create({
      data: {
        tenantId,
        planId,
        status: "active",
        billingCycle,
        startedAt: now,
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        provider: "manual",
        createdBy: session?.user.id,
      },
    });

    await tx.tenant.update({
      where: { id: tenantId },
      data: { currentSubscriptionId: created.id },
    });
  });

  revalidatePath("/superadmin/tenants");
  revalidatePath("/superadmin/subscriptions");

  return { ok: true };
}


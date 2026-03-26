"use server";

import prisma from "@/src/lib/prisma";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import type { PlanWithFeatures } from "@/src/adapters/subscription-adapter";
import { CrudPlanUseCase } from "@/src/application/superadmin/use-cases/plan/crudPlan.usecase";
import { PrismaConfigAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-config.adapter";
import { BillingCycle } from "@/prisma/generated/client";
import { revalidatePath } from "next/cache";

export type TenantSubscriptionUsage = {
  users: number;
  branches: number;
  products: number;
  clients: number;
  inventoryItems: number;
};

export async function getTenantSubscriptionDataAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) return null;

  const membership = await prisma.userTenantMembership.findFirst({
    where: { userId: session.user.id, status: "active" },
    select: { tenantId: true },
  });
  if (!membership) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: membership.tenantId },
    select: { id: true, currentSubscriptionId: true },
  });
  if (!tenant) return null;

  const configRepo = new PrismaConfigAdapter();
  const tenantConfig = await configRepo.getOrCreateTenantConfig(tenant.id);
  const paymentMethods = Array.isArray(tenantConfig?.cash?.paymentMethods)
    ? tenantConfig.cash.paymentMethods
    : [];
  const hasPaymentMethod = paymentMethods.some((method: any) => method?.active);

  let subscription = null;
  if (tenant.currentSubscriptionId) {
    subscription = await prisma.tenantSubscription.findUnique({
      where: { id: tenant.currentSubscriptionId },
    });
  }

  if (!subscription) {
    subscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId: tenant.id,
        status: { in: ["trial", "active", "past_due"] },
      },
      orderBy: { startedAt: "desc" },
    });
  }

  const planUseCase = new CrudPlanUseCase();
  const rawPlans = await planUseCase.executeFindAll("system-plans-tenant");

  const plans: PlanWithFeatures[] = rawPlans.map((plan: any) => {
    const moduleKeys = (plan.modules || []).map((m: any) => m.moduleKey);
    const hasSalesModule = moduleKeys.includes("sales");
    const hasRentalsModule = moduleKeys.includes("rentals");
    let mode: "all" | "sales_only" | "rentals_only" | "none" = "none";

    if (hasSalesModule && hasRentalsModule) mode = "all";
    else if (hasSalesModule) mode = "sales_only";
    else if (hasRentalsModule) mode = "rentals_only";

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description || undefined,
      priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : 0,
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : 0,
      trialDays: plan.trialDays ?? undefined,
      features: {
        analytics: (plan.features || []).some(
          (f: any) => f.featureKey === "analytics",
        ),
        promotions: (plan.features || []).some(
          (f: any) => f.featureKey === "promotions",
        ),
        referrals: (plan.features || []).some(
          (f: any) => f.featureKey === "referrals",
        ),
        referralRewards: (plan.features || []).some(
          (f: any) => f.featureKey === "referralRewards",
        ),
        loyalty: (plan.features || []).some(
          (f: any) => f.featureKey === "loyalty",
        ),
      },
      limits: {
        users:
          (plan.limits || []).find((l: any) => l.limitKey === "users")?.limit ||
          0,
        branches:
          (plan.limits || []).find((l: any) => l.limitKey === "branches")
            ?.limit || 0,
        products:
          (plan.limits || []).find((l: any) => l.limitKey === "products")
            ?.limit || 0,
        clients:
          (plan.limits || []).find((l: any) => l.limitKey === "clients")?.limit ||
          0,
        inventoryItems:
          (plan.limits || []).find(
            (l: any) => l.limitKey === "inventoryItems",
          )?.limit || 0,
      },
      modules: {
        sales: hasSalesModule,
        rentals: hasRentalsModule,
        mode,
      },
    };
  });

  const [
    usersCount,
    branchesCount,
    productsCount,
    clientsCount,
    inventoryItemsCount,
  ] = await Promise.all([
    prisma.userTenantMembership.count({
      where: { tenantId: tenant.id, status: "active" },
    }),
    prisma.branch.count({ where: { tenantId: tenant.id } }),
    prisma.product.count({ where: { tenantId: tenant.id } }),
    prisma.client.count({ where: { tenantId: tenant.id } }),
    prisma.inventoryItem.count({ where: { tenantId: tenant.id } }),
  ]);

  const usage: TenantSubscriptionUsage = {
    users: usersCount,
    branches: branchesCount,
    products: productsCount,
    clients: clientsCount,
    inventoryItems: inventoryItemsCount,
  };

  return {
    subscription,
    plans,
    usage,
    hasPaymentMethod,
  };
}

export async function changeTenantPlanAction(
  planId: string,
  billingCycle: BillingCycle,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const membership = await prisma.userTenantMembership.findFirst({
    where: { userId: session.user.id, status: "active" },
    select: { tenantId: true },
  });
  if (!membership) {
    throw new Error("No active tenant membership");
  }

  const tenantId = membership.tenantId;
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { id: true },
  });
  if (!plan) {
    throw new Error("Plan not found");
  }

  const currentSubscription = await prisma.tenantSubscription.findFirst({
    where: {
      tenantId,
      status: { in: ["trial", "active", "past_due"] },
    },
    orderBy: { startedAt: "desc" },
  });

  const configRepo = new PrismaConfigAdapter();
  const tenantConfig = await configRepo.getOrCreateTenantConfig(tenantId);
  const paymentMethods = Array.isArray(tenantConfig?.cash?.paymentMethods)
    ? tenantConfig.cash.paymentMethods
    : [];
  const hasPaymentMethod = paymentMethods.some((method: any) => method?.active);

  if (currentSubscription?.status === "trial" && !hasPaymentMethod) {
    throw new Error("Payment method required to change plan during trial");
  }

  if (
    currentSubscription &&
    currentSubscription.planId === planId &&
    currentSubscription.billingCycle === billingCycle &&
    currentSubscription.status !== "canceled"
  ) {
    return { ok: true, unchanged: true };
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + (billingCycle === "monthly" ? 1 : 12));
  const isTrialChange = currentSubscription?.status === "trial";
  const trialEndsAt = isTrialChange
    ? currentSubscription?.trialEndsAt ?? currentSubscription?.currentPeriodEnd
    : undefined;
  const effectivePeriodEnd = isTrialChange && trialEndsAt ? trialEndsAt : endDate;

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

    const newSubscription = await tx.tenantSubscription.create({
      data: {
        tenantId,
        planId,
        status: isTrialChange ? "trial" : "active",
        billingCycle,
        startedAt: now,
        currentPeriodStart: now,
        currentPeriodEnd: effectivePeriodEnd,
        trialEndsAt: trialEndsAt ?? undefined,
        provider: "manual",
        createdBy: session.user.id,
      },
    });

    await tx.tenant.update({
      where: { id: tenantId },
      data: { currentSubscriptionId: newSubscription.id },
    });
  });

  revalidatePath("/tenant/subscription");
  revalidatePath("/tenant/home");

  return { ok: true };
}

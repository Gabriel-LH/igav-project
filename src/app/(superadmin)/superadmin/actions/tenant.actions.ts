"use server";

import { requireSuperAdmin } from "@/src/infrastructure/superadmin/auth.guard";
import { CrudTenantUseCase } from "@/src/application/superadmin/use-cases/tenant/crudTenant.usecase";
import { CrudPlanUseCase } from "@/src/application/superadmin/use-cases/plan/crudPlan.usecase";
import { CrudSubscriptionUseCase } from "@/src/application/superadmin/use-cases/subscription/crudSubscription.usecase";
import { BillingCycle } from "@/prisma/generated/client";
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const tenantUseCase = new CrudTenantUseCase();
const planUseCase = new CrudPlanUseCase();
const subscriptionUseCase = new CrudSubscriptionUseCase();

export async function getTenantsDashboardData() {
  await requireSuperAdmin();

  const tenants = await tenantUseCase.executeFindAll();
  const rawPlans = await planUseCase.executeFindAll();

  // Convert Prisma Decimal objects to plain numbers for Next.js Client Component serialization
  const plans = rawPlans.map((plan: any) => ({
    ...plan,
    priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : 0,
    priceYearly: plan.priceYearly ? Number(plan.priceYearly) : 0,
  }));

  const subscriptions = await subscriptionUseCase.executeFindAll();

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

  const tenant = await tenantUseCase.executeFindById(tenantId);
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
      plan = {
        ...rawPlan,
        priceMonthly: rawPlan.priceMonthly ? Number(rawPlan.priceMonthly) : 0,
        priceYearly: rawPlan.priceYearly ? Number(rawPlan.priceYearly) : 0,
      };
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

  const subscription = await subscriptionUseCase.executeCreate({
    tenantId,
    planId,
    status: "active",
    billingCycle,
    startedAt: now,
    currentPeriodStart: now,
    currentPeriodEnd: endDate,
    provider: "manual",
    createdBy: session?.user.id,
  });

  revalidatePath("/superadmin/tenants");
  revalidatePath("/superadmin/subscriptions");
  
  return subscription;
}


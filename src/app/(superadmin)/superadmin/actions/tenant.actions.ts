"use server";

import { requireSuperAdmin } from "@/src/infrastructure/superadmin/auth.guard";
import { CrudTenantUseCase } from "@/src/application/superadmin/use-cases/tenant/crudTenant.usecase";
import { CrudPlanUseCase } from "@/src/application/superadmin/use-cases/plan/crudPlan.usecase";

const tenantUseCase = new CrudTenantUseCase();
const planUseCase = new CrudPlanUseCase();

export async function getTenantsDashboardData() {
  await requireSuperAdmin();

  const tenants = await tenantUseCase.executeFindAll();
  const plans = await planUseCase.executeFindAll();

  // Extraemos las subscripciones desde los tenants
  // Asumiendo que PrismaAdapter devuelve tenantSubscriptions (hay que agregarlo en findAll)
  // En nuestro caso el Adapter actual no trae tenantSubscriptions por defecto en findAll
  // pero el Layout Mock usa TENTANT_SUBSCRIPTIONS_MOCK

  return {
    tenants,
    plans,
    subscriptions: [], // Por implementar si hubiera un CrudSubscriptionUseCase
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
    plan = await planUseCase.executeFindById(subscription.planId);
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

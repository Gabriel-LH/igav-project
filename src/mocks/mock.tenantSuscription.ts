import { TenantSubscription } from "../types/tenant/tenantSuscription";

export const TENTANT_SUBSCRIPTIONS_MOCK: TenantSubscription[] = [
  {
    tenantId: "tenant-c",
    planId: "plan-sales",
    status: "active",
    startedAt: new Date(),
    endsAt: new Date(),
    id: "tenant-sub-a",
  },
  {
    tenantId: "tenant-b",
    planId: "plan-rentals",
    status: "active",
    startedAt: new Date(),
    endsAt: new Date(),
    id: "tenant-sub-b",
  },
  {
    tenantId: "tenant-a",
    planId: "plan-full",
    status: "active",
    startedAt: new Date(),
    endsAt: new Date(),
    id: "tenant-sub-c",
  },
];

import { TenantSubsCriptionStatus, BillingCycle, Provider } from "@/prisma/generated/client";

export interface CreateSubscriptionDTO {
  tenantId: string;
  planId: string;
  billingCycle: BillingCycle;
  startedAt: Date;
  trialEndsAt?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  provider: Provider;
  status: TenantSubsCriptionStatus;
  createdBy?: string;
}

export interface SubscriptionRepository {
  create(data: CreateSubscriptionDTO): Promise<unknown>;
  findAll(): Promise<unknown[]>;
  findByTenantId(tenantId: string): Promise<unknown[]>;
  updateStatus(id: string, status: TenantSubsCriptionStatus): Promise<unknown>;
  delete(id: string): Promise<void>;
}

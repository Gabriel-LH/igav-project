import prisma from "@/src/lib/prisma";
import { 
  SubscriptionRepository, 
  CreateSubscriptionDTO 
} from "@/src/domain/superadmin/repositories/SubscriptionRepository";
import { TenantSubsCriptionStatus, TenantSubscription } from "@/prisma/generated/client";

export class PrismaSubscriptionAdapter implements SubscriptionRepository {
  async create(data: CreateSubscriptionDTO): Promise<TenantSubscription> {
    return prisma.tenantSubscription.create({
      data: {
        tenantId: data.tenantId,
        planId: data.planId,
        status: data.status,
        billingCycle: data.billingCycle,
        startedAt: data.startedAt,
        trialEndsAt: data.trialEndsAt,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        provider: data.provider,
        createdBy: data.createdBy,
      },
    });
  }

  async findAll(): Promise<TenantSubscription[]> {
    return prisma.tenantSubscription.findMany({
      include: {
        tenant: true,
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }) as unknown as Promise<TenantSubscription[]>;
  }

  async findByTenantId(tenantId: string): Promise<TenantSubscription[]> {
    return prisma.tenantSubscription.findMany({
      where: { tenantId },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }) as unknown as Promise<TenantSubscription[]>;
  }

  async updateStatus(id: string, status: TenantSubsCriptionStatus): Promise<TenantSubscription> {
    return prisma.tenantSubscription.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.tenantSubscription.delete({
      where: { id },
    });
  }
}

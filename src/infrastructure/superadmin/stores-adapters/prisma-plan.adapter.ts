import {
  PlanRepository,
  CreatePlanDTO,
  UpdatePlanDTO,
} from "@/src/domain/superadmin/repositories/PlanRepository";
import prisma from "@/src/lib/prisma";

export class PrismaPlanAdapter implements PlanRepository {
  async create(tenantId: string, data: CreatePlanDTO): Promise<any> {
    return prisma.$transaction(async (tx) => {
      const plan = await tx.plan.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description,
          currency: data.currency || "PEN",
          priceMonthly: data.priceMonthly,
          priceYearly: data.priceYearly,
          trialDays: data.trialDays,
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? 0,
        },
      });

      if (data.features && data.features.length > 0) {
        await tx.planFeature.createMany({
          data: data.features.map((featureKey) => ({
            tenantId,
            planId: plan.id,
            featureKey,
          })),
        });
      }

      if (data.limits && data.limits.length > 0) {
        await tx.planLimit.createMany({
          data: data.limits.map((limit) => ({
            tenantId,
            planId: plan.id,
            limitKey: limit.limitKey,
            limit: limit.limit,
          })),
        });
      }

      if (data.modules && data.modules.length > 0) {
        await tx.planModule.createMany({
          data: data.modules.map((moduleKey) => ({
            tenantId,
            planId: plan.id,
            moduleKey,
          })),
        });
      }

      return plan;
    });
  }

  async update(id: string, data: UpdatePlanDTO): Promise<any> {
    return prisma.$transaction(async (tx) => {
      const plan = await tx.plan.findUnique({ where: { id } });
      if (!plan) throw new Error("Plan not found");

      const updatedPlan = await tx.plan.update({
        where: { id },
        data: {
          name: data.name !== undefined ? data.name : undefined,
          description:
            data.description !== undefined ? data.description : undefined,
          currency: data.currency !== undefined ? data.currency : undefined,
          priceMonthly:
            data.priceMonthly !== undefined ? data.priceMonthly : undefined,
          priceYearly:
            data.priceYearly !== undefined ? data.priceYearly : undefined,
          trialDays: data.trialDays !== undefined ? data.trialDays : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
          sortOrder: data.sortOrder !== undefined ? data.sortOrder : undefined,
        },
      });

      if (data.features) {
        await tx.planFeature.deleteMany({ where: { planId: id } });
        await tx.planFeature.createMany({
          data: data.features.map((featureKey) => ({
            tenantId: plan.tenantId,
            planId: id,
            featureKey,
          })),
        });
      }

      if (data.limits) {
        await tx.planLimit.deleteMany({ where: { planId: id } });
        await tx.planLimit.createMany({
          data: data.limits.map((limit) => ({
            tenantId: plan.tenantId,
            planId: id,
            limitKey: limit.limitKey,
            limit: limit.limit,
          })),
        });
      }

      if (data.modules) {
        await tx.planModule.deleteMany({ where: { planId: id } });
        await tx.planModule.createMany({
          data: data.modules.map((moduleKey) => ({
            tenantId: plan.tenantId,
            planId: id,
            moduleKey,
          })),
        });
      }

      return updatedPlan;
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.plan.findUnique({
      where: { id },
      include: {
        features: true,
        limits: true,
        modules: true,
      },
    });
  }

  async findAll(tenantId?: string): Promise<any[]> {
    return prisma.plan.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        features: true,
        limits: true,
        modules: true,
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async delete(id: string): Promise<any> {
    return prisma.plan.delete({
      where: { id },
    });
  }
}

import {
  Promotion as PrismaPromotionRecord,
  Prisma,
  PrismaClient,
  PromotionType,
  PromotionScope,
  AppliesToType,
  UsageType,
} from "@/prisma/generated/client";
import { PromotionRepository } from "@/src/domain/tenant/repositories/PromotionRepository";
import { Promotion as DomainPromotion } from "@/src/types/promotion/type.promotion";

const mapPrismaPromotion = (promo: PrismaPromotionRecord): DomainPromotion => ({
  id: promo.id,
  tenantId: promo.tenantId ?? undefined,
  name: promo.name,
  type: promo.type as DomainPromotion["type"],
  scope: promo.scope as DomainPromotion["scope"],
  value: promo.value ?? undefined,
  appliesTo: promo.appliesTo as DomainPromotion["appliesTo"],
  bundleConfig: promo.bundleConfig ? (promo.bundleConfig as any) : undefined,
  isExclusive: promo.isExclusive,
  code: promo.code ?? undefined,
  targetIds: promo.targetIds,
  startDate: promo.startDate,
  endDate: promo.endDate ?? undefined,
  isActive: promo.isActive,
  branchIds: promo.branchIds,
  minPurchaseAmount: promo.minPurchaseAmount ?? undefined,
  maxUses: promo.maxUses ?? undefined,
  usedCount: promo.usedCount,
  combinable: promo.combinable,
  requiresCode: promo.requiresCode,
  singleUsePerCustomer: promo.singleUsePerCustomer,
  usageType: promo.usageType as DomainPromotion["usageType"],
  createdAt: promo.createdAt,
  createdBy: promo.createdBy ?? undefined,
  updatedAt: promo.updatedAt,
  updatedBy: promo.updatedBy ?? undefined,
});

export class PrismaPromotionRepository implements PromotionRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async createPromotion(promotion: DomainPromotion): Promise<void> {
    await this.prisma.promotion.create({
      data: {
        id: promotion.id,
        tenantId: promotion.tenantId,
        name: promotion.name,
        type: promotion.type as PromotionType,
        scope: promotion.scope as PromotionScope,
        value: promotion.value,
        appliesTo: promotion.appliesTo as AppliesToType[],
        bundleConfig: promotion.bundleConfig as Prisma.InputJsonValue,
        isExclusive: promotion.isExclusive,
        code: promotion.code,
        targetIds: promotion.targetIds,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: promotion.isActive,
        branchIds: promotion.branchIds,
        minPurchaseAmount: promotion.minPurchaseAmount,
        maxUses: promotion.maxUses,
        usedCount: promotion.usedCount,
        combinable: promotion.combinable,
        requiresCode: promotion.requiresCode,
        singleUsePerCustomer: promotion.singleUsePerCustomer,
        usageType: promotion.usageType as UsageType,
        createdBy: promotion.createdBy,
        updatedBy: promotion.updatedBy,
      },
    });
  }

  async updatePromotion(
    promotionId: string,
    updates: Partial<DomainPromotion>,
  ): Promise<void> {
    await this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        ...updates,
        type: (updates.type as PromotionType) || undefined,
        scope: (updates.scope as PromotionScope) || undefined,
        appliesTo: (updates.appliesTo as AppliesToType[]) || undefined,
        bundleConfig: (updates.bundleConfig as Prisma.InputJsonValue) || undefined,
        usageType: (updates.usageType as UsageType) || undefined,
      },
    });
  }

  async getPromotionById(
    tenantId: string,
    promotionId: string,
  ): Promise<DomainPromotion | null> {
    const promo = await this.prisma.promotion.findFirst({
      where: { id: promotionId, tenantId },
    });
    return promo ? mapPrismaPromotion(promo) : null;
  }

  async getPromotionsByTenant(
    tenantId: string,
    opts?: { includeInactive?: boolean },
  ): Promise<DomainPromotion[]> {
    const promos = await this.prisma.promotion.findMany({
      where: {
        tenantId,
        ...(opts?.includeInactive ? {} : { isActive: true }),
      },
      orderBy: { createdAt: "desc" },
    });
    return promos.map(mapPrismaPromotion);
  }

  async togglePromotion(promotionId: string, isActive: boolean): Promise<void> {
    await this.prisma.promotion.update({
      where: { id: promotionId },
      data: { isActive },
    });
  }

  setPromotions(promotions: DomainPromotion[]): void {
    // Sync logic not needed for server-side Prisma repo
  }

  getPromotions(): DomainPromotion[] {
    // Only used in older Zustand-dependent code. 
    // New code should use getPromotionsByTenant.
    return [];
  }

  getIsHydrated(): boolean {
    return true;
  }
}

import { PromotionRepository } from "../../../domain/tenant/repositories/PromotionRepository";
import { Promotion } from "../../../types/promotion/type.promotion";
import prisma from "@/src/lib/prisma";

export class PrismaPromotionAdapter implements PromotionRepository {
  private prisma = prisma;

  async createPromotion(promotion: Promotion): Promise<void> {
    await this.prisma.promotion.create({
      data: {
        id: promotion.id,
        tenantId: promotion.tenantId,
        name: promotion.name,
        type: promotion.type as any,
        scope: promotion.scope as any,
        value: promotion.value,
        appliesTo: promotion.appliesTo as any,
        bundleConfig: promotion.bundleConfig as any,
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
        usageType: promotion.usageType as any,
        createdBy: promotion.createdBy,
        updatedBy: promotion.updatedBy,
      },
    });
  }

  async updatePromotion(
    promotionId: string,
    updates: Partial<Promotion>,
  ): Promise<void> {
    await this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        ...updates,
        type: updates.type as any,
        scope: updates.scope as any,
        appliesTo: updates.appliesTo as any,
        bundleConfig: updates.bundleConfig as any,
        usageType: updates.usageType as any,
        updatedAt: new Date(),
      },
    });
  }

  async getPromotionById(
    tenantId: string,
    promotionId: string,
  ): Promise<Promotion | null> {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId, tenantId },
    });

    if (!promotion) return null;

    return {
      ...promotion,
      type: promotion.type as any,
      scope: promotion.scope as any,
      usageType: promotion.usageType as any,
      appliesTo: promotion.appliesTo as any,
      bundleConfig: promotion.bundleConfig as any,
    } as Promotion;
  }

  async getPromotionsByTenant(
    tenantId: string,
    opts?: { includeInactive?: boolean },
  ): Promise<Promotion[]> {
    const promotions = await this.prisma.promotion.findMany({
      where: {
        tenantId,
        isActive: opts?.includeInactive ? undefined : true,
      },
      orderBy: { createdAt: "desc" },
    });

    return promotions.map(
      (p) =>
        ({
          ...p,
          type: p.type as any,
          scope: p.scope as any,
          usageType: p.usageType as any,
          appliesTo: p.appliesTo as any,
          bundleConfig: p.bundleConfig as any,
        }) as Promotion,
    );
  }

  async togglePromotion(promotionId: string, isActive: boolean): Promise<void> {
    await this.prisma.promotion.update({
      where: { id: promotionId },
      data: { isActive },
    });
  }

  // --- Memoria / UI State (Zustand) ---
  // Estos métodos no suelen usarse en un adaptador de persistencia puro en el servidor,
  // pero los definimos para completar el contrato de la interfaz.
  setPromotions(promotions: Promotion[]): void {
    throw new Error("setPromotions NOT IMPLEMENTED: Persistence repository cannot handle UI state.");
  }

  getPromotions(): Promotion[] {
    throw new Error("getPromotions NOT IMPLEMENTED: Use getPromotionsByTenant instead.");
  }

  getIsHydrated(): boolean {
      return true; // En el servidor siempre está "hidratado" el acceso a DB
  }
}

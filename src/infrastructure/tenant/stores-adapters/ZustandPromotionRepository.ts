import { PromotionRepository } from "@/src/domain/tenant/repositories/PromotionRepository";
import { Promotion } from "@/src/types/promotion/type.promotion";
import { usePromotionStore } from "@/src/store/usePromotionStore";

export class ZustandPromotionRepository implements PromotionRepository {
  // Persistencia (Not Implemented on Client-side Zustand Adapter)
  async createPromotion(promotion: Promotion): Promise<void> {
    throw new Error("createPromotion not supported in ZustandPromotionRepository");
  }
  async updatePromotion(
    promotionId: string,
    updates: Partial<Promotion>,
  ): Promise<void> {
    throw new Error("updatePromotion not supported in ZustandPromotionRepository");
  }
  async getPromotionById(
    tenantId: string,
    promotionId: string,
  ): Promise<Promotion | null> {
    return (
      usePromotionStore
        .getState()
        .promotions.find((p) => p.id === promotionId) || null
    );
  }
  async getPromotionsByTenant(
    tenantId: string,
    opts?: { includeInactive?: boolean },
  ): Promise<Promotion[]> {
    return usePromotionStore
      .getState()
      .promotions.filter(
        (p) => p.tenantId === tenantId && (opts?.includeInactive || p.isActive),
      );
  }
  async togglePromotion(promotionId: string, isActive: boolean): Promise<void> {
    throw new Error("togglePromotion not supported in ZustandPromotionRepository");
  }

  // Memoria / UI State (Zustand)
  setPromotions(promotions: Promotion[]): void {
    usePromotionStore.getState().setPromotions(promotions);
  }
  getPromotions(): Promotion[] {
    return usePromotionStore.getState().promotions;
  }
  getIsHydrated(): boolean {
    return usePromotionStore.getState().isHydrated;
  }
}

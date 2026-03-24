import { PromotionRepository } from "../../../domain/tenant/repositories/PromotionRepository";
import { usePromotionStore } from "../../../store/usePromotionStore";
import { Promotion } from "../../../types/promotion/type.promotion";

export class ZustandPromotionRepository implements PromotionRepository {
  // Persistencia (Zustand repo doesn't persist directly, it's a UI state wrapper)
  async createPromotion(promotion: Promotion): Promise<void> {
    const current = usePromotionStore.getState().promotions;
    usePromotionStore.getState().setPromotions([...current, promotion]);
  }

  async updatePromotion(
    promotionId: string,
    updates: Partial<Promotion>,
  ): Promise<void> {
    const current = usePromotionStore.getState().promotions;
    usePromotionStore
      .getState()
      .setPromotions(
        current.map((p) => (p.id === promotionId ? { ...p, ...updates } : p)),
      );
  }

  async getPromotionById(
    tenantId: string,
    promotionId: string,
  ): Promise<Promotion | null> {
    return (
      usePromotionStore.getState().promotions.find((p) => p.id === promotionId) ||
      null
    );
  }

  async getPromotionsByTenant(
    tenantId: string,
    opts?: { includeInactive?: boolean },
  ): Promise<Promotion[]> {
    const promotions = usePromotionStore.getState().promotions;
    if (opts?.includeInactive) return promotions;
    return promotions.filter((p) => p.isActive);
  }

  async togglePromotion(promotionId: string, isActive: boolean): Promise<void> {
    await this.updatePromotion(promotionId, { isActive });
  }

  // UI State Methods
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

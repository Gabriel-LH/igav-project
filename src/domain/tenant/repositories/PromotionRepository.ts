import { Promotion } from "../../../types/promotion/type.promotion";

export interface PromotionRepository {
  // Persistencia (Prisma)
  createPromotion(promotion: Promotion): Promise<void>;
  updatePromotion(promotionId: string, updates: Partial<Promotion>): Promise<void>;
  getPromotionById(tenantId: string, promotionId: string): Promise<Promotion | null>;
  getPromotionsByTenant(tenantId: string, opts?: { includeInactive?: boolean }): Promise<Promotion[]>;
  togglePromotion(promotionId: string, isActive: boolean): Promise<void>;

  // Memoria / UI State (Zustand)
  setPromotions(promotions: Promotion[]): void;
  getPromotions(): Promotion[];
  getIsHydrated(): boolean;
}

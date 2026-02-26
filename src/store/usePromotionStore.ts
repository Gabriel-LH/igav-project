// usePromotionStore.ts

import { create } from "zustand";
import { Promotion } from "@/src/types/promotion/type.promotion";

interface PromotionState {
  promotions: Promotion[];
  isHydrated: boolean;
  setPromotions: (promos: Promotion[]) => void;
}

export const usePromotionStore = create<PromotionState>((set) => ({
  promotions: [],
  isHydrated: false,
  setPromotions: (promotions) => set({ promotions, isHydrated: true }),
}));

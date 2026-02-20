import { create } from "zustand";
import { SaleReversal } from "@/src/types/sales/type.saleReversal";

interface SaleReversalState {
  reversals: SaleReversal[];
  addReversal: (reversal: SaleReversal) => void;
}

export const useSaleReversalStore = create<SaleReversalState>((set) => ({
  reversals: [],
  addReversal: (reversal) =>
    set((state) => ({
      reversals: [...state.reversals, reversal],
    })),
}));

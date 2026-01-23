// src/store/useGuaranteeStore.ts
import { create } from "zustand";
import { Guarantee } from "../types/guarantee/type.guarantee";

interface GuaranteeStore {
  guarantees: Guarantee[];
  addGuarantee: (guarantee: Guarantee) => void;
  updateGuaranteeStatus: (id: string, status: Guarantee["status"]) => void;
}

export const useGuaranteeStore = create<GuaranteeStore>((set) => ({
  guarantees: [],
  addGuarantee: (guarantee) =>
    set((state) => ({
      guarantees: [...state.guarantees, guarantee],
    })),
  updateGuaranteeStatus: (id, status) =>
    set((state) => ({
      guarantees: state.guarantees.map((g) =>
        g.id === id ? { ...g, status, updatedAt: new Date() } : g,
      ),
    })),
}));

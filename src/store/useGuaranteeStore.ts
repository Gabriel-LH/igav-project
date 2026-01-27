// src/store/useGuaranteeStore.ts
import { create } from "zustand";
import { Guarantee } from "../types/guarantee/type.guarantee";

interface GuaranteeStore {
  guarantees: Guarantee[];
  addGuarantee: (guarantee: Guarantee) => void;
  updateGuaranteeStatus: (id: string, status: Guarantee["status"]) => void;
  releaseGuarantee: (id: string) => void;
}

export const useGuaranteeStore = create<GuaranteeStore>((set) => ({
  guarantees: [],
  addGuarantee: (guarantee) =>
    set((state) => {
      console.log("🔵 [addGuarantee] Nueva garantía:", guarantee);
      return {
        guarantees: [...state.guarantees, guarantee],
      };
    }),
  updateGuaranteeStatus: (id, status) =>
    set((state) => ({
      guarantees: state.guarantees.map((g) =>
        g.id === id ? { ...g, status, updatedAt: new Date() } : g,
      ),
    })),
  releaseGuarantee: (id) =>
    set((state) => ({
      guarantees: state.guarantees.map((g) =>
        g.id === id
          ? { ...g, status: "liberada", updatedAt: new Date() }
          : g,
      ),
    })),
}));

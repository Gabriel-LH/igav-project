"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Branch } from "@/src/types/branch/type.branch";

export const GLOBAL_BRANCH_ID = "global";

interface BranchStore {
  branches: Branch[];
  selectedBranchId: string;
  canUseGlobal: boolean;
  setBranches: (branches: Branch[]) => void;
  setSelectedBranchId: (branchId: string) => void;
  setCanUseGlobal: (value: boolean) => void;
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set, get) => ({
      branches: [],
      selectedBranchId: "",
      canUseGlobal: false,
      setBranches: (branches) => {
        const currentId = get().selectedBranchId;
        const canUseGlobal = get().canUseGlobal;
        const isGlobal = currentId === GLOBAL_BRANCH_ID && canUseGlobal;
        const valid =
          (currentId &&
            branches.some((branch) => branch.id === currentId)) ||
          isGlobal;
        const nextSelectedId = valid
          ? currentId
          : branches[0]?.id ?? "";
        set({ branches, selectedBranchId: nextSelectedId });
      },
      setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
      setCanUseGlobal: (value) =>
        set((state) => ({
          canUseGlobal: value,
          selectedBranchId:
            !value && state.selectedBranchId === GLOBAL_BRANCH_ID
              ? state.branches[0]?.id ?? ""
              : state.selectedBranchId,
        })),
    }),
    {
      name: "branch-store",
      partialize: (state) => ({ selectedBranchId: state.selectedBranchId }),
    },
  ),
);

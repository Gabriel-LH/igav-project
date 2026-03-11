import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PendingTenant = {
  tenantName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  branchName: string;
  city: string;
  address: string;
  phone?: string;
  logoUrl?: string;
  planId?: string;
  trialDays?: number;
};

interface RegisterStore {
  email: string;
  password: string;
  pendingTenant: PendingTenant | null;
  setCredentials: (email: string, password: string) => void;
  setPendingTenant: (tenant: PendingTenant) => void;
  clearPendingTenant: () => void;
  clear: () => void;
}

export const useRegisterStore = create<RegisterStore>()(
  persist(
    (set) => ({
      email: "",
      password: "",
      pendingTenant: null,
      setCredentials: (email, password) => set({ email, password }),
      setPendingTenant: (tenant) => set({ pendingTenant: tenant }),
      clearPendingTenant: () => set({ pendingTenant: null }),
      clear: () => set({ email: "", password: "", pendingTenant: null }),
    }),
    {
      name: "register-storage",
      partialize: (state) => ({
        email: state.email,
        password: state.password,
        pendingTenant: state.pendingTenant,
      }),
    },
  ),
);

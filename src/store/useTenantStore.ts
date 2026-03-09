import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_TENANT } from "@/src/mocks/mock.tenant";
import { Tenant } from "@/src/types/tenant/type.tenant";

interface TenantState {
  activeTenant: Tenant;
  setActiveTenant: (tenant: Tenant) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenant: MOCK_TENANT[0],
      setActiveTenant: (tenant) => set({ activeTenant: tenant }),
    }),
    {
      name: "tenant-storage",
    },
  ),
);

import { create } from "zustand";
import { MOCK_TENANT } from "@/src/mocks/mock.tenant";
import { Tenant } from "@/src/types/tenant/type.tenant";

interface TenantState {
  activeTenant: Tenant;
  setActiveTenant: (tenant: Tenant) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  activeTenant: MOCK_TENANT,
  setActiveTenant: (tenant) => set({ activeTenant: tenant }),
}));

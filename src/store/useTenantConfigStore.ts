// src/store/useTenantConfigStore.ts
import { create } from "zustand";
import { type TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { type TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { getTenantConfigAction, getActivePolicyAction } from "@/src/app/(tenant)/tenant/actions/settings.actions";
import { DEFAULT_TENANT_CONFIG } from "@/src/lib/tenant-defaults";

interface TenantConfigState {
  config: TenantConfig | null;
  policy: TenantPolicy | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setConfig: (config: TenantConfig) => void;
  setPolicy: (policy: TenantPolicy) => void;
  loadConfig: () => Promise<void>;
  loadPolicy: () => Promise<void>;
  ensureLoaded: () => Promise<void>;
}

// Valores por defecto seguros para evitar que la UI rompa si no hay datos en BD
export const DEFAULT_CONFIG: Partial<TenantConfig> = DEFAULT_TENANT_CONFIG;

export const useTenantConfigStore = create<TenantConfigState>((set, get) => ({
  config: null,
  policy: null,
  isLoading: false,
  error: null,

  setConfig: (config) => set({ config }),
  setPolicy: (policy) => set({ policy }),

  loadConfig: async () => {
    set({ isLoading: true });
    try {
      const res = await getTenantConfigAction();
      if (res.success && res.data) {
        set({ config: res.data as TenantConfig, error: null });
      } else {
        // Si falla o no hay, usamos un híbrido o null (el componente lo manejará)
        console.warn("No se pudo cargar la configuración del tenant, usando valores semilla.");
      }
    } catch (err) {
      set({ error: "Error cargando configuración" });
    } finally {
      set({ isLoading: false });
    }
  },

  loadPolicy: async () => {
    set({ isLoading: true });
    try {
      const res = await getActivePolicyAction();
      if (res.success && res.data) {
        set({ policy: res.data as TenantPolicy, error: null });
      }
    } catch (err) {
      set({ error: "Error cargando políticas" });
    } finally {
      set({ isLoading: false });
    }
  },

  ensureLoaded: async () => {
    const { config, policy, isLoading } = get();
    if (isLoading) return;
    if (!config || !policy) {
      await Promise.all([get().loadConfig(), get().loadPolicy()]);
    }
  },
}));

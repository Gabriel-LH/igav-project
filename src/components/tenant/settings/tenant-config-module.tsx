// components/tenant-config/TenantConfigModule.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiscalConfigForm } from "./fiscal-config-form";
import { PricingConfigForm } from "./pricing-config-fomr";
import { LoyaltyConfigForm } from "./loyalty-config-form";
import { ReferralConfigForm } from "./referral-config-form";
import { DEFAULT_CONFIG } from "@/src/store/useTenantConfigStore";
import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import type { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CashierIcon,
  DiscountTag01Icon,
  MoneyBag02Icon,
  SaleTag01Icon,
  StarIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { CashConfigForm } from "./cash-config-form";
import { LogisticsConfigForm } from "./logistics-config-form";
import {
  getTenantConfigAction,
  updateTenantConfigAction,
  getActivePolicyAction,
  upsertPolicyAction,
} from "@/src/app/(tenant)/tenant/actions/settings.actions";
import { toast } from "sonner";
import { TenantProfileCard } from "./tenant-profile-card";
import { Tenant } from "@/src/types/tenant/type.tenant";
import { SettingsHeader } from "./settings-header";

interface TenantConfigModuleProps {
  tenantProfile: Tenant;
}

export function TenantConfigModule({ tenantProfile }: TenantConfigModuleProps) {
  const [config, setConfig] = useState<TenantConfig>(DEFAULT_CONFIG as TenantConfig);
  const [originalConfig, setOriginalConfig] = useState<TenantConfig>(DEFAULT_CONFIG as TenantConfig);
  const [policy, setPolicy] = useState<TenantPolicy | null>(null);
  const [originalPolicy, setOriginalPolicy] = useState<TenantPolicy | null>(null);

  const [activeTab, setActiveTab] = useState("general");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setIsLoading(true);
      try {
        const [configRes, policyRes] = await Promise.all([
          getTenantConfigAction(),
          getActivePolicyAction(),
        ]);

        if (cancelled) return;

        if (configRes.success && configRes.data) {
          const merged = {
            ...DEFAULT_CONFIG,
            ...configRes.data,
            tax: { ...DEFAULT_CONFIG.tax, ...(configRes.data.tax || {}) },
            pricing: { ...DEFAULT_CONFIG.pricing, ...(configRes.data.pricing || {}) },
            loyalty: { ...DEFAULT_CONFIG.loyalty, ...(configRes.data.loyalty || {}) },
            cash: { ...DEFAULT_CONFIG.cash, ...(configRes.data.cash || {}) },
            referrals: { ...DEFAULT_CONFIG.referrals, ...(configRes.data.referrals || {}) },
          };
          setConfig(merged as TenantConfig);
          setOriginalConfig(merged as TenantConfig);
        }

        if (policyRes.success && policyRes.data) {
          setPolicy(policyRes.data as TenantPolicy);
          setOriginalPolicy(policyRes.data as TenantPolicy);
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const configChanged = JSON.stringify(config) !== JSON.stringify(originalConfig);
    const policyChanged = JSON.stringify(policy) !== JSON.stringify(originalPolicy);
    setHasUnsavedChanges(configChanged || policyChanged);
  }, [config, originalConfig, policy, originalPolicy]);

  const handleConfigChange = (section: keyof TenantConfig, values: any) => {
    setConfig({
      ...config,
      [section]: { ...(config[section] as any), ...values },
    });
  };

  const handleRootConfigChange = (values: Partial<TenantConfig>) => {
    setConfig({ ...config, ...values });
  };

  const handlePolicyChange = (section: keyof TenantPolicy, values: any) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      [section]: { ...(policy[section] as any), ...values },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises: Promise<any>[] = [];
      if (JSON.stringify(config) !== JSON.stringify(originalConfig)) {
        promises.push(updateTenantConfigAction(config));
      }
      if (JSON.stringify(policy) !== JSON.stringify(originalPolicy) && policy) {
        promises.push(upsertPolicyAction(policy, "Actualización de políticas desde ajustes"));
      }

      if (promises.length === 0) return;

      const results = await Promise.all(promises);
      if (results.every((r) => r.success)) {
        toast.success("Cambios guardados correctamente");
        setOriginalConfig(config);
        setOriginalPolicy(policy);
        setHasUnsavedChanges(false);
      } else {
        toast.error("Error al guardar algunos cambios");
      }
    } catch (error) {
      toast.error("Error de servidor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setConfig(originalConfig);
    setPolicy(originalPolicy);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-b-violet-600 border-t-violet-300 mx-auto mb-4"></div>
        <div className="text-center animate-pulse text-muted-foreground">Cargando configuración general...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <SettingsHeader
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        handleCancel={handleCancel}
        handleSave={handleSave}
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="md:col-span-4 space-y-6">
          <TabsList className="bg-muted px-1 h-12">
            <TabsTrigger value="general" className="px-6">Negocio</TabsTrigger>
            <TabsTrigger value="fiscal" className="px-6">Fiscal</TabsTrigger>
            <TabsTrigger value="pricing" className="px-6">Precios</TabsTrigger>
            <TabsTrigger value="programs" className="px-6">Programas</TabsTrigger>
            <TabsTrigger value="logistics" className="px-6">Logística</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="general" className="mt-0"><TenantProfileCard tenant={tenantProfile} /></TabsContent>
            <TabsContent value="fiscal" className="mt-0">
              <FiscalConfigForm config={config} onChange={(v) => handleConfigChange("tax", v)} />
            </TabsContent>
            <TabsContent value="pricing" className="mt-0">
              <PricingConfigForm config={config} onChange={(v) => handleConfigChange("pricing", v)} />
            </TabsContent>
            <TabsContent value="programs" className="mt-0">
              <div className="space-y-4">
                <LoyaltyConfigForm config={config} onChange={(v) => handleConfigChange("loyalty", v)} />
                <ReferralConfigForm config={config} onChange={(v) => handleConfigChange("referrals", v)} />
              </div>
            </TabsContent>
            <TabsContent value="logistics" className="mt-0">
              <LogisticsConfigForm config={config} onChange={handleRootConfigChange} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

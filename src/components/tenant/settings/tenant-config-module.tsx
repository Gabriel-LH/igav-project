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
import {
  getTenantConfigAction,
  updateTenantConfigAction,
} from "@/src/app/(tenant)/tenant/actions/settings.actions";
import { toast } from "sonner";
import { TenantProfileCard } from "./tenant-profile-card";
import { Tenant } from "@/src/types/tenant/type.tenant";
import { SettingsHeader } from "./settings-header";

interface TenantConfigModuleProps {
  tenantProfile: Tenant;
}

export function TenantConfigModule({ tenantProfile }: TenantConfigModuleProps) {
  // Inicializar con Defaults de entrada para evitar estado null
  const [config, setConfig] = useState<TenantConfig>(
    DEFAULT_CONFIG as TenantConfig,
  );
  const [originalConfig, setOriginalConfig] = useState<TenantConfig>(
    DEFAULT_CONFIG as TenantConfig,
  );

  const [activeTab, setActiveTab] = useState("general");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos reales
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getTenantConfigAction();
        if (res.success && res.data) {
          // Combinación básica para asegurar que no falten secciones críticas
          const merged = {
            ...DEFAULT_CONFIG,
            ...res.data,
            tax: { ...DEFAULT_CONFIG.tax, ...(res.data.tax || {}) },
            pricing: { ...DEFAULT_CONFIG.pricing, ...(res.data.pricing || {}) },
            loyalty: { ...DEFAULT_CONFIG.loyalty, ...(res.data.loyalty || {}) },
            cash: { ...DEFAULT_CONFIG.cash, ...(res.data.cash || {}) },
            referrals: {
              ...DEFAULT_CONFIG.referrals,
              ...(res.data.referrals || {}),
            },
          };
          setConfig(merged as TenantConfig);
          setOriginalConfig(merged as TenantConfig);
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Detectar cambios sin guardar
  useEffect(() => {
    setHasUnsavedChanges(
      JSON.stringify(config) !== JSON.stringify(originalConfig),
    );
  }, [config, originalConfig]);

  const handleConfigChange = (section: keyof TenantConfig, values: any) => {
    setConfig({
      ...config,
      [section]: {
        ...(config[section] as any),
        ...values,
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateTenantConfigAction(config);
      if (res.success) {
        toast.success("Configuración guardada correctamente");
        setOriginalConfig(config);
        setHasUnsavedChanges(false);
      } else {
        toast.error("Error al guardar: " + res.error);
      }
    } catch (error) {
      toast.error("Error de red al guardar configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setConfig(originalConfig);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-b-violet-600 border-t-violet-300 mx-auto mb-4"></div>
        <div className="text-center animate-pulse text-muted-foreground">
          Cargando configuración general...
        </div>
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
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="md:col-span-4 space-y-6"
        >
          <TabsList>
            <TabsTrigger value="general" className="py-2.5">
              <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4 mr-2" />
              Negocio
            </TabsTrigger>
            <TabsTrigger value="fiscal" className="py-2.5">
              <HugeiconsIcon icon={MoneyBag02Icon} className="w-4 h-4 mr-2" />
              Fiscal
            </TabsTrigger>
            <TabsTrigger value="pricing" className="py-2.5">
              <HugeiconsIcon icon={SaleTag01Icon} className="w-4 h-4 mr-2" />
              Precios
            </TabsTrigger>

            <TabsTrigger value="programs" className="py-2.5">
              <HugeiconsIcon icon={StarIcon} className="w-4 h-4 mr-2" />
              Programas
            </TabsTrigger>
            <TabsTrigger value="cash" className="py-2.5">
              <HugeiconsIcon icon={CashierIcon} className="w-4 h-4 mr-2" />
              Caja
            </TabsTrigger>
          </TabsList>

          <div>
            <TabsContent value="general" className="m-0 focus-visible:ring-0">
              <TenantProfileCard tenant={tenantProfile} />
            </TabsContent>
            <TabsContent value="fiscal" className="m-0 focus-visible:ring-0">
              <FiscalConfigForm
                config={config}
                onChange={(v) => handleConfigChange("tax", v)}
              />
            </TabsContent>

            <TabsContent value="pricing" className="m-0 focus-visible:ring-0">
              <PricingConfigForm
                config={config}
                onChange={(v) => handleConfigChange("pricing", v)}
              />
            </TabsContent>

            <TabsContent value="programs" className="m-0 focus-visible:ring-0">
              <div className="space-y-4">
                <LoyaltyConfigForm
                  config={config}
                  onChange={(v) => handleConfigChange("loyalty", v)}
                />
                <ReferralConfigForm
                  config={config}
                  onChange={(v) => handleConfigChange("referrals", v)}
                />
              </div>
            </TabsContent>

            <TabsContent value="cash" className="m-0 focus-visible:ring-0">
              <CashConfigForm
                config={config}
                onChange={(v) => handleConfigChange("cash", v)}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

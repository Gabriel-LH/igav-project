// components/tenant-config/TenantConfigModule.tsx
"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiscalConfigForm } from "./fiscal-config-form";
import { PricingConfigForm } from "./pricing-config-fomr";
import { DiscountsConfigForm } from "./discount-config-form";
import { LoyaltyConfigForm } from "./loyalty-config-form";
import { useTenantConfigStore, DEFAULT_CONFIG } from "@/src/store/useTenantConfigStore";
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

export function TenantConfigModule() {
  // Inicializar con Defaults de entrada para evitar estado null
  const [config, setConfig] = useState<TenantConfig>(DEFAULT_CONFIG as TenantConfig);
  const [originalConfig, setOriginalConfig] = useState<TenantConfig>(DEFAULT_CONFIG as TenantConfig);
  
  const [activeTab, setActiveTab] = useState("fiscal");
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
              pricing: { ...DEFAULT_CONFIG.pricing, ...(res.data.pricing || {}) }
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
    setHasUnsavedChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
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
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        Cargando configuración general...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <HugeiconsIcon icon={Settings01Icon} className="w-6 h-6 text-primary" />
            </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuración del Sistema</h1>
            <p className="text-muted-foreground">
              Gestiona los parámetros fiscales, precios y reglas de caja de tu negocio.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Descartar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Guardando..." : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar cambios
                    </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="md:col-span-4 space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-muted/50">
            <TabsTrigger value="fiscal" className="py-2.5">
              <HugeiconsIcon icon={MoneyBag02Icon} className="w-4 h-4 mr-2" />
              Fiscal
            </TabsTrigger>
            <TabsTrigger value="pricing" className="py-2.5">
              <HugeiconsIcon icon={SaleTag01Icon} className="w-4 h-4 mr-2" />
              Precios
            </TabsTrigger>
            <TabsTrigger value="discounts" className="py-2.5">
              <HugeiconsIcon icon={DiscountTag01Icon} className="w-4 h-4 mr-2" />
              Descuentos
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="py-2.5">
              <HugeiconsIcon icon={StarIcon} className="w-4 h-4 mr-2" />
              Fidelidad
            </TabsTrigger>
            <TabsTrigger value="cash" className="py-2.5">
              <HugeiconsIcon icon={CashierIcon} className="w-4 h-4 mr-2" />
              Caja
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="fiscal" className="m-0 focus-visible:ring-0">
              <FiscalConfigForm config={config} onChange={(v) => handleConfigChange("tax", v)} />
            </TabsContent>

            <TabsContent value="pricing" className="m-0 focus-visible:ring-0">
              <PricingConfigForm config={config} onChange={(v) => handleConfigChange("pricing", v)} />
            </TabsContent>

            <TabsContent value="discounts" className="m-0 focus-visible:ring-0">
              <DiscountsConfigForm config={config} onChange={(v) => handleConfigChange("discounts", v)} />
            </TabsContent>

            <TabsContent value="loyalty" className="m-0 focus-visible:ring-0">
              <LoyaltyConfigForm config={config} onChange={(v) => handleConfigChange("loyalty", v)} />
            </TabsContent>

            <TabsContent value="cash" className="m-0 focus-visible:ring-0">
              <CashConfigForm config={config} onChange={(v) => handleConfigChange("cash", v)} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// components/tenant-config/TenantConfigModule.tsx
"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Save, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiscalConfigForm } from "./fiscal-config-form";
import { PricingConfigForm } from "./pricing-config-fomr";
import { DiscountsConfigForm } from "./discount-config-form";
import { LoyaltyConfigForm } from "./loyalty-config-form";
import { ConfirmModal } from "./ui/ConfirmModal";
import { MOCK_TENANT_CONFIG, HAS_SALES } from "@/src/mocks/mock.tenantConfig";
import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CashierIcon,
  DiscountTag01Icon,
  MoneyBag02Icon,
  SaleTag01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { CashConfigForm } from "./cash-config-form";

export function TenantConfigModule() {
  const [config, setConfig] = useState<TenantConfig>(MOCK_TENANT_CONFIG);
  const [originalConfig, setOriginalConfig] =
    useState<TenantConfig>(MOCK_TENANT_CONFIG);
  const [activeTab, setActiveTab] = useState("fiscal");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<TenantConfig>>(
    {},
  );
  const [requiresRestart, setRequiresRestart] = useState<string[]>([]);

  // Detectar cambios sin guardar
  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasUnsavedChanges(changed);
  }, [config, originalConfig]);

  const handleConfigChange = (section: keyof TenantConfig, values: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]:
        typeof values === "object" && values !== null
          ? { ...(prev[section] as any), ...values }
          : values,
    }));
  };

  const handleSave = async () => {
    // Detectar qué secciones cambiaron y si requieren reinicio
    const changedSections: string[] = [];
    const sectionsThatNeedRestart: string[] = [];

    if (JSON.stringify(config.tax) !== JSON.stringify(originalConfig.tax)) {
      changedSections.push("tax");
      sectionsThatNeedRestart.push("Configuración fiscal");
    }
    if (
      config.pricing.pricePrecision !== originalConfig.pricing.pricePrecision
    ) {
      changedSections.push("pricing.pricePrecision");
      sectionsThatNeedRestart.push("Precisión de precios");
    }

    // Verificar si hay cambios fiscales y ya existen ventas
    if (changedSections.includes("tax") && HAS_SALES) {
      setPendingChanges(config);
      setShowConfirmModal(true);
      return;
    }

    // Guardar cambios
    await performSave(config, sectionsThatNeedRestart);
  };

  const performSave = async (
    newConfig: TenantConfig,
    restartSections: string[],
  ) => {
    // Aquí iría la llamada a la API
    console.log("Guardando configuración:", newConfig);

    setOriginalConfig(newConfig);
    setHasUnsavedChanges(false);

    if (restartSections.length > 0) {
      setRequiresRestart(restartSections);
      // Mostrar notificación de reinicio necesario
    }
  };

  const handleCancel = () => {
    setConfig(originalConfig);
    setHasUnsavedChanges(false);
  };

  const handleConfirmFiscalChanges = async () => {
    setShowConfirmModal(false);
    await performSave(pendingChanges as TenantConfig, ["Configuración fiscal"]);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-end items-center">
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alerta de cambios que requieren reinicio */}
      {requiresRestart.length > 0 && (
        <Alert
          variant="default"
          className="border-amber-500 bg-amber-50 dark:bg-amber-950/20"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Requiere reinicio de sesión</AlertTitle>
          <AlertDescription>
            Los siguientes cambios requerirán que los usuarios cierren sesión y
            vuelvan a iniciar:
            <ul className="list-disc ml-6 mt-2">
              {requiresRestart.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs principales */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-4xl grid-cols-5">
          <TabsTrigger value="fiscal" className="flex items-center gap-2">
            <HugeiconsIcon icon={MoneyBag02Icon} />
            Información Fiscal
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <HugeiconsIcon icon={SaleTag01Icon} />
            Precios
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <HugeiconsIcon icon={DiscountTag01Icon} />
            Descuentos
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <HugeiconsIcon icon={StarIcon} className="fill-amber-400" />
            Lealtad
          </TabsTrigger>
          <TabsTrigger value="cash" className="flex items-center gap-2">
            <HugeiconsIcon icon={CashierIcon} />
            Caja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fiscal" className="space-y-4">
          <FiscalConfigForm
            config={config}
            onChange={(values) => handleConfigChange("tax", values)}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingConfigForm
            config={config}
            onChange={(values) => handleConfigChange("pricing", values)}
          />
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <DiscountsConfigForm
            config={config}
            onChange={(values) => handleConfigChange("discounts", values)}
          />
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <LoyaltyConfigForm
            config={config}
            onChange={(values) => handleConfigChange("loyalty", values)}
          />
        </TabsContent>

        <TabsContent value="cash" className="space-y-4">
          <CashConfigForm
            config={config}
            onChange={(values) => handleConfigChange("cash", values)}
          />
        </TabsContent>
      </Tabs>
      {/* Modal de confirmación para cambios fiscales */}
      <ConfirmModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        title="⚠️ Cambios en configuración fiscal"
        description="Ya existen ventas registradas en el sistema. Modificar la configuración fiscal puede afectar el cálculo de impuestos en períodos anteriores. ¿Estás seguro de continuar?"
        confirmText="Sí, continuar"
        cancelText="No, cancelar"
        variant="destructive"
        onConfirm={handleConfirmFiscalChanges}
      />
    </div>
  );
}

// src/app/superadmin/billing/features/page.tsx
"use client";

import React, { useState } from "react";
import { FeaturesManager } from "./features-manager";
import { LimitsManager } from "./limits-manager";
import { FeaturesTable } from "./features-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, ListChecks, Gauge, Package } from "lucide-react";
import {
  PlanFeatureKey,
  PLAN_FEATURE_KEYS,
} from "@/src/types/plan/planFeature";
import { PlanLimitKey } from "@/src/types/plan/type.planLimitKey";

// Mocks específicos de features
import { PLAN_FEATURES_MOCK } from "@/src/mocks/mock.planFeature";
import { PLAN_LIMITS_MOCK } from "@/src/mocks/mock.planLimit";
import { PLANS_MOCK } from "@/src/mocks/mock.plans";
import { CreateFeatureModal } from "./ui/modal/CreateFeatureModal";
import { CreateLimitModal } from "./ui/modal/CreateLimitModal";
import { BulkAssignFeaturesModal } from "./ui/modal/BulkAssignFeaturesModal";

export function FeaturesModule() {
  const [activeTab, setActiveTab] = useState("global");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Estados para modales
  const [createFeatureOpen, setCreateFeatureOpen] = useState(false);
  const [createLimitOpen, setCreateLimitOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  // Features globales del sistema (todas las disponibles)
  const [globalFeatures, setGlobalFeatures] = useState<Set<PlanFeatureKey>>(
    new Set(PLAN_FEATURE_KEYS),
  );

  // Límites globales por defecto
  const [globalLimits, setGlobalLimits] = useState<
    Partial<Record<PlanLimitKey, number>>
  >({
    users: 1000,
    branches: 100,
    products: 10000,
    clients: 50000,
    inventoryItems: 20000,
    promotions: 100,
    analytics: 365,
    referrals: 1000,
    referralRewards: 1000,
    loyalty: 10000,
    subscriptions: -1,
  });

  const handleFeatureToggle = (feature: PlanFeatureKey) => {
    const newFeatures = new Set(globalFeatures);
    if (newFeatures.has(feature)) {
      newFeatures.delete(feature);
    } else {
      newFeatures.add(feature);
    }
    setGlobalFeatures(newFeatures);
  };

  const handleLimitChange = (key: PlanLimitKey, value: number) => {
    setGlobalLimits((prev) => ({ ...prev, [key]: value }));
  };

  const getFeaturesForPlan = (planId: string) => {
    return PLAN_FEATURES_MOCK.filter((f) => f.planId === planId).map(
      (f) => f.featureKey,
    );
  };

  const getLimitsForPlan = (planId: string) => {
    return PLAN_LIMITS_MOCK.filter((l) => l.planId === planId).reduce(
      (acc, curr) => ({
        ...acc,
        [curr.limitKey]: curr.limit,
      }),
      {} as Record<PlanLimitKey, number>,
    );
  };

  const refreshData = () => {
    // Aquí iría la lógica para refrescar los datos
    console.log("Refrescando datos...");
  };

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Features & Limits
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkAssignOpen(true)}>
              <ListChecks className="h-4 w-4 mr-2" />
              Asignar Múltiples
            </Button>
            <Button onClick={() => setCreateFeatureOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Feature
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="global" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Global
            </TabsTrigger>
            <TabsTrigger value="byPlan" className="flex items-center">
              <ListChecks className="h-4 w-4 mr-2" />
              Por Plan
            </TabsTrigger>
            <TabsTrigger value="limits" className="flex items-center">
              <Gauge className="h-4 w-4 mr-2" />
              Límites
            </TabsTrigger>
          </TabsList>

          {/* Tab: Configuración Global de Features */}
          <TabsContent value="global">
            <FeaturesManager
              selectedFeatures={globalFeatures}
              onFeatureToggle={handleFeatureToggle}
              mode="global"
              title="Features del Sistema"
              description="Configura las características disponibles en todo el sistema"
              onSave={() => console.log("Guardando features globales...")}
            />
          </TabsContent>

          {/* Tab: Features por Plan */}
          <TabsContent value="byPlan">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Lista de planes */}
              <Card className="md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Planes</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBulkAssignOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {PLANS_MOCK.map((plan) => (
                      <Button
                        key={plan.id}
                        variant={
                          selectedPlanId === plan.id ? "default" : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        {plan.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Features del plan seleccionado */}
              <Card className="md:col-span-3">
                {selectedPlanId ? (
                  <FeaturesManager
                    selectedFeatures={
                      new Set(getFeaturesForPlan(selectedPlanId))
                    }
                    onFeatureToggle={(feature) => {
                      // Aquí iría la lógica para actualizar features del plan
                      console.log(
                        "Toggle feature for plan:",
                        selectedPlanId,
                        feature,
                      );
                    }}
                    mode="plan"
                    planName={
                      PLANS_MOCK.find((p) => p.id === selectedPlanId)?.name
                    }
                    showSearch={true}
                    onSave={() => console.log("Guardando features del plan...")}
                  />
                ) : (
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Selecciona un plan para ver sus features
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Límites */}
          <TabsContent value="limits">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Lista de planes para límites */}
              <Card className="md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Planes</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateLimitOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant={
                        selectedPlanId === "global" ? "default" : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => setSelectedPlanId("global")}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Límites Globales
                    </Button>
                    {PLANS_MOCK.map((plan) => (
                      <Button
                        key={plan.id}
                        variant={
                          selectedPlanId === plan.id ? "default" : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        {plan.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Límites del plan seleccionado */}
              <Card className="md:col-span-3">
                {selectedPlanId === "global" ? (
                  <LimitsManager
                    limits={globalLimits}
                    onLimitChange={handleLimitChange}
                    mode="global"
                    title="Límites Globales"
                    description="Configura los límites por defecto para todos los planes"
                    onSave={() => console.log("Guardando límites globales...")}
                  />
                ) : selectedPlanId ? (
                  <LimitsManager
                    limits={getLimitsForPlan(selectedPlanId)}
                    onLimitChange={(key, value) => {
                      // Aquí iría la lógica para actualizar límites del plan
                      console.log(
                        "Update limit for plan:",
                        selectedPlanId,
                        key,
                        value,
                      );
                    }}
                    mode="plan"
                    planName={
                      PLANS_MOCK.find((p) => p.id === selectedPlanId)?.name
                    }
                    onSave={() => console.log("Guardando límites del plan...")}
                  />
                ) : (
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Selecciona un plan para ver sus límites
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Tabla de Features existentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Features Registradas</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateFeatureOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Feature
            </Button>
          </CardHeader>
          <CardContent>
            <FeaturesTable features={PLAN_FEATURES_MOCK} plans={PLANS_MOCK} />
          </CardContent>
        </Card>
      </div>

      {/* Modales */}
      <CreateFeatureModal
        open={createFeatureOpen}
        onOpenChange={setCreateFeatureOpen}
        onSuccess={refreshData}
      />

      <CreateLimitModal
        open={createLimitOpen}
        onOpenChange={setCreateLimitOpen}
        onSuccess={refreshData}
      />

      <BulkAssignFeaturesModal
        open={bulkAssignOpen}
        onOpenChange={setBulkAssignOpen}
        onSuccess={refreshData}
      />
    </>
  );
}

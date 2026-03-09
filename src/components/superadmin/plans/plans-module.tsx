// src/app/superadmin/plans/page.tsx
"use client";

import { useState } from "react";
import { PlansTable } from "@/src/components/superadmin/plans/table/plans-table";
import { PlanDetailsTabs } from "@/src/components/superadmin/plans/plan-details-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, CreditCard, Package, TrendingUp } from "lucide-react";

import { Plan } from "@/src/types/plan/planSchema";

interface PlansModuleProps {
  initialPlans: Plan[];
  initialSubscriptions: any[];
  initialTenants: any[];
}

export function PlansModule({
  initialPlans,
  initialSubscriptions,
  initialTenants,
}: PlansModuleProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  // Estadísticas de planes
  const totalPlans = initialPlans.length;
  const activePlans = initialPlans.filter((p) => p.isActive).length;
  const totalSubscriptions = initialSubscriptions.length;
  const plansWithTenants = new Set(initialSubscriptions.map((s) => s.planId))
    .size;

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Planes</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Planes
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlans}</div>
              <p className="text-xs text-muted-foreground">
                {activePlans} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Planes con Tenants
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plansWithTenants}</div>
              <p className="text-xs text-muted-foreground">
                de {totalPlans} planes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Suscripciones Activas
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                distribuidas en {plansWithTenants} planes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Precio Promedio
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/{" "}
                {totalPlans > 0
                  ? (
                      initialPlans.reduce(
                        (acc, p) => acc + (p.priceMonthly || 0),
                        0,
                      ) / totalPlans
                    ).toFixed(0)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">mensual por plan</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales: Lista de planes y Detalle del plan seleccionado */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="list">Lista de Planes</TabsTrigger>
            {selectedPlan && (
              <TabsTrigger value="details">
                Detalle: {selectedPlan.name}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todos los Planes</CardTitle>
              </CardHeader>
              <CardContent>
                <PlansTable
                  plans={initialPlans}
                  onSelectPlan={(plan) => {
                    setSelectedPlan(plan);
                    setActiveTab("details");
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {selectedPlan && (
              <PlanDetailsTabs
                plan={selectedPlan}
                tenants={initialTenants}
                subscriptions={initialSubscriptions}
                onBack={() => {
                  setSelectedPlan(null);
                  setActiveTab("list");
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// src/app/superadmin/billing/subscriptions/page.tsx
"use client";

import React, { useState } from "react";
import { SubscriptionsTable } from "./subscription-table";
import { SubscriptionDetailsTabs } from "./susbcription-details-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";

import { Plan } from "@/src/types/plan/planSchema";

interface SubscriptionModuleProps {
  initialPlans: Plan[];
  initialSubscriptions: any[];
  initialTenants: any[];
}

export function SubscriptionModule({
  initialPlans,
  initialSubscriptions,
  initialTenants,
}: SubscriptionModuleProps) {
  const [selectedSubscription, setSelectedSubscription] =
    useState<TenantSubscription | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  // Estadísticas
  const activeSubscriptions = initialSubscriptions.filter(
    (s) => s.status === "active",
  ).length;
  const trialSubscriptions = initialSubscriptions.filter(
    (s) => s.status === "trial",
  ).length;
  const pastDueSubscriptions = initialSubscriptions.filter(
    (s) => s.status === "past_due",
  ).length;
  const canceledSubscriptions = initialSubscriptions.filter(
    (s) => s.status === "canceled",
  ).length;

  // MRR (Monthly Recurring Revenue)
  const mrr = initialSubscriptions
    .filter((s) => s.status === "active")
    .reduce((total, sub) => {
      const plan = initialPlans.find((p) => p.id === sub.planId);
      if (!plan) return total;
      if (sub.billingCycle === "yearly" && plan.priceYearly) {
        return total + plan.priceYearly / 12;
      }
      return total + (plan.priceMonthly || 0);
    }, 0);

  const getTenantForSubscription = (subscription: TenantSubscription) => {
    return initialTenants.find((t) => t.id === subscription.tenantId)!;
  };

  const getPlanForSubscription = (subscription: TenantSubscription) => {
    return initialPlans.find((p) => p.id === subscription.planId)!;
  };

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Suscripciones</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {initialSubscriptions.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeSubscriptions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {trialSubscriptions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {pastDueSubscriptions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S/ {mrr.toFixed(0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="list">Lista de Suscripciones</TabsTrigger>
            {selectedSubscription && (
              <TabsTrigger value="details">
                Detalle:{" "}
                {
                  initialTenants.find(
                    (t) => t.id === selectedSubscription.tenantId,
                  )?.name
                }
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Todas las Suscripciones</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionsTable
                  subscriptions={initialSubscriptions}
                  tenants={initialTenants}
                  plans={initialPlans}
                  onSelectSubscription={(subscription) => {
                    setSelectedSubscription(subscription);
                    setActiveTab("details");
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            {selectedSubscription && (
              <SubscriptionDetailsTabs
                subscription={selectedSubscription}
                tenant={getTenantForSubscription(selectedSubscription)}
                plan={getPlanForSubscription(selectedSubscription)}
                onBack={() => {
                  setSelectedSubscription(null);
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

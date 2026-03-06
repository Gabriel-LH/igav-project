// src/app/dashboard/page.tsx
import React from "react";
import { MetricCards } from "./metric-cards";
import { SecondaryMetrics } from "./secondary-metrics";
import { Charts } from "./charts";
import { RecentActivityTable } from "./recent-activity-table";
import { PlansDistribution } from "./plans-distribution";

import { TENTANT_SUBSCRIPTIONS_MOCK } from "@/src/mocks/mock.tenantSuscription";
import { PLANS_MOCK } from "@/src/mocks/mock.plans";
import { MOCK_TENANT } from "@/src/mocks/mock.tenant";

export function DashboardLayout() {
  // Calcular métricas principales
  const activeSubscriptions = TENTANT_SUBSCRIPTIONS_MOCK.filter(
    (s) => s.status === "active",
  ).length;
  const activeTenants = MOCK_TENANT.filter((t) => t.status === "active").length;

  // Calcular MRR
  const mrr = TENTANT_SUBSCRIPTIONS_MOCK.filter(
    (s) => s.status === "active",
  ).reduce((total, sub) => {
    const plan = PLANS_MOCK.find((p) => p.id === sub.planId);
    if (!plan) return total;

    if (sub.billingCycle === "yearly" && plan.priceYearly) {
      return total + plan.priceYearly / 12;
    }
    return total + plan.priceMonthly;
  }, 0);

  // Calcular churn rate
  const canceledLastMonth = TENTANT_SUBSCRIPTIONS_MOCK.filter(
    (s) =>
      s.status === "canceled" &&
      s.canceledAt &&
      s.canceledAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  ).length;

  const totalSubscriptions = TENTANT_SUBSCRIPTIONS_MOCK.length;
  const churnRate =
    totalSubscriptions > 0
      ? Number(((canceledLastMonth / totalSubscriptions) * 100).toFixed(1))
      : 0;

  // Métricas secundarias
  const newTenants = MOCK_TENANT.filter(
    (t) => t.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  ).length;

  const trialUsers = TENTANT_SUBSCRIPTIONS_MOCK.filter(
    (s) => s.status === "trial",
  ).length;
  const pastDueSubscriptions = TENTANT_SUBSCRIPTIONS_MOCK.filter(
    (s) => s.status === "past_due",
  ).length;

  // Datos para gráficas
  const monthlyRevenue = [
    { month: "Jan", revenue: 8 },
    { month: "Feb", revenue: 9 },
    { month: "Mar", revenue: 11 },
    { month: "Apr", revenue: 12 },
  ];

  const weeklyNewTenants = [
    { week: "Semana 1", tenants: 3 },
    { week: "Semana 2", tenants: 4 },
    { week: "Semana 3", tenants: 6 },
  ];

  // Actividad reciente para la tabla
  const recentActivities = [
    {
      id: "1",
      type: "tenant_created" as const,
      description: "Nuevo tenant creado",
      tenantName: "Tech Solutions SAC",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "2",
      type: "plan_updated" as const,
      description: "Actualización a plan Business",
      tenantName: "Digital Store Perú",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: "3",
      type: "subscription_canceled" as const,
      description: "Suscripción cancelada",
      tenantName: "Consultores Asociados",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: "4",
      type: "payment_received" as const,
      description: "Pago recibido - S/ 399",
      tenantName: "Tech Solutions SAC",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "5",
      type: "tenant_created" as const,
      description: "Nuevo tenant creado",
      tenantName: "Innova Corp",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "6",
      type: "payment_received" as const,
      description: "Pago recibido - S/ 199",
      tenantName: "Digital Store Perú",
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  ];

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>

        <MetricCards
          mrr={mrr}
          activeTenants={activeTenants}
          activeSubscriptions={activeSubscriptions}
          churnRate={churnRate}
        />

        <SecondaryMetrics
          newTenants={newTenants}
          trialUsers={trialUsers}
          pastDueSubscriptions={pastDueSubscriptions}
        />

        <Charts
          monthlyRevenue={monthlyRevenue}
          weeklyNewTenants={weeklyNewTenants}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="md:col-span-4">
            <RecentActivityTable activities={recentActivities} />
          </div>
          <div className="md:col-span-3">
            <PlansDistribution
              plans={PLANS_MOCK}
              subscriptions={TENTANT_SUBSCRIPTIONS_MOCK}
              activeSubscriptions={activeSubscriptions}
            />
          </div>
        </div>
      </div>
    </>
  );
}

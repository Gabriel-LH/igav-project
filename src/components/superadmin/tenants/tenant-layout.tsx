// src/app/superadmin/tenants/page.tsx
import React from "react";
import { TenantsTable } from "./table/tenants-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Building2, Users, CreditCard, AlertCircle } from "lucide-react";

// Mocks
import { TENTANT_SUBSCRIPTIONS_MOCK } from "@/src/mocks/mock.tenantSuscription";
import { PLANS_MOCK } from "@/src/mocks/mock.plans";
import { MOCK_TENANT } from "@/src/mocks/mock.tenant";

export function TenantLayout() {
  const activeTenants = MOCK_TENANT.filter((t) => t.status === "active").length;
  const totalUsers = 45; // Esto vendría de un mock de usuarios
  const trialTenants = TENTANT_SUBSCRIPTIONS_MOCK.filter(
    (s) => s.status === "trial",
  ).length;
  const pastDueTenants = TENTANT_SUBSCRIPTIONS_MOCK.filter(
    (s) => s.status === "past_due",
  ).length;

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Tenants
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_TENANT.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeTenants} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuarios Totales
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Promedio 5.6 por tenant
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Trial</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trialTenants}</div>
              <p className="text-xs text-muted-foreground">
                Próximos a convertir
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pastDueTenants}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Tenants */}
        <Card>
          <CardHeader>
            <CardTitle>Todos los Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantsTable
              tenants={MOCK_TENANT}
              subscriptions={TENTANT_SUBSCRIPTIONS_MOCK}
              plans={PLANS_MOCK}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

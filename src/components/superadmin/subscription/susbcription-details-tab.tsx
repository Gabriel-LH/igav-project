// src/components/billing/subscriptions/SubscriptionDetailsTabs.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Building2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";
import { Tenant } from "@/src/types/tenant/type.tenant";
import { Plan } from "@/src/types/plan/planSchema";

interface SubscriptionDetailsTabsProps {
  subscription: TenantSubscription;
  tenant: Tenant;
  plan: Plan;
  onBack: () => void;
}

export const SubscriptionDetailsTabs: React.FC<
  SubscriptionDetailsTabsProps
> = ({ subscription, tenant, plan, onBack }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      trial: "secondary",
      past_due: "destructive",
      canceled: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case "created":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "plan_changed":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "payment":
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case "renewal":
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a lista
          </Button>
          <h3 className="text-2xl font-semibold">
            Suscripción: {tenant?.name || "Desconocido"}
          </h3>
          {getStatusBadge(subscription.status)}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Factura
          </Button>
          {subscription.status === "active" && (
            <Button variant="destructive" size="sm">
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Tab Overview */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Información del Tenant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Tenant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span className="font-medium">{tenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>admin@{tenant.slug}.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge
                    variant={
                      tenant.status === "active" ? "default" : "destructive"
                    }
                  >
                    {tenant.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado:</span>
                  <span>{tenant.createdAt.toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Información del Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio:</span>
                  <span>
                    {subscription.billingCycle === "monthly"
                      ? `S/ ${plan.priceMonthly}/mes`
                      : `S/ ${plan.priceYearly}/año`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ciclo:</span>
                  <Badge variant="outline" className="capitalize">
                    {subscription.billingCycle}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proveedor:</span>
                  <span className="capitalize">{subscription.provider}</span>
                </div>
              </CardContent>
            </Card>

            {/* Detalles de Suscripción */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Detalles de Suscripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Started At</p>
                    <p className="font-medium">
                      {subscription.startedAt.toLocaleDateString()}
                    </p>
                  </div>
                  {subscription.trialEndsAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Trial Ends
                      </p>
                      <p className="font-medium">
                        {subscription.trialEndsAt.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Period Start
                    </p>
                    <p>
                      {subscription.currentPeriodStart.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Period End
                    </p>
                    <p>{subscription.currentPeriodEnd.toLocaleDateString()}</p>
                  </div>
                  {subscription.externalSubscriptionId && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        External ID
                      </p>
                      <p className="font-mono text-sm">
                        {subscription.externalSubscriptionId}
                      </p>
                    </div>
                  )}
                  {subscription.canceledAt && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Canceled At
                      </p>
                      <p className="font-medium text-red-600">
                        {subscription.canceledAt.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Billing */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Información de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Próximo pago */}
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Próximo Pago
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {subscription.billingCycle === "monthly"
                          ? `S/ ${plan.priceMonthly}`
                          : `S/ ${plan.priceYearly}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Fecha:{" "}
                        {subscription.currentPeriodEnd.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {Math.ceil(
                        (subscription.currentPeriodEnd.getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24),
                      )}{" "}
                      días
                    </Badge>
                  </div>
                </div>

                {/* Historial de pagos */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Últimos Pagos
                  </h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>15/03/2024</TableCell>
                          <TableCell>S/ 399</TableCell>
                          <TableCell>Tarjeta de Crédito</TableCell>
                          <TableCell>
                            <Badge variant="default">Pagado</Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>15/02/2024</TableCell>
                          <TableCell>S/ 399</TableCell>
                          <TableCell>Tarjeta de Crédito</TableCell>
                          <TableCell>
                            <Badge variant="default">Pagado</Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>15/01/2024</TableCell>
                          <TableCell>S/ 399</TableCell>
                          <TableCell>Tarjeta de Crédito</TableCell>
                          <TableCell>
                            <Badge variant="default">Pagado</Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Historial de la Suscripción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Historial vendrá de la API */}
                <div className="text-center py-8 text-muted-foreground">
                  El historial de suscripción se implementará próximamente.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

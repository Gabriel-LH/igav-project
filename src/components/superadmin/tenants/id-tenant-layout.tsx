// src/app/superadmin/tenants/[id]/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CreditCard,
  Package,
  User2,
  ArrowLeft,
  Edit,
  Repeat,
  Ban,
} from "lucide-react";

// Tipos para los límites del plan
interface PlanLimit {
  users: { used: number; limit: number };
  branches: { used: number; limit: number };
  products: { used: number; limit: number };
  clients: { used: number; limit: number };
}

export function TenantIdLayout({ initialData }: { initialData: any }) {
  const router = useRouter();

  // Obtener datos del tenant desde initialData (DB real)
  const tenant = initialData.tenant;
  const owner = tenant?.owner ?? null;
  const subscription = initialData.subscription;
  const plan = initialData.plan;
  const usage = initialData.usage;

  console.log("initialData del tenant", initialData);

  if (!tenant) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Tenant no encontrado
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header con navegación */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{tenant.name}</h2>
        <Badge variant={tenant.status === "active" ? "default" : "destructive"}>
          {tenant.status}
        </Badge>
      </div>

      {/* Información rápida */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plan?.name || "Sin plan"}</div>
            <p className="text-xs text-muted-foreground">
              {subscription?.billingCycle === "monthly"
                ? "Ciclo mensual"
                : "Ciclo anual"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
            <User2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{owner?.name || "Sin owner"}</div>
            <p className="text-xs text-muted-foreground">
              {owner?.email || "Sin correo registrado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fecha Creación
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(tenant.createdAt).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Hace{" "}
              {Math.floor(
                (Date.now() - new Date(tenant.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24),
              )}{" "}
              días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo pago</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          {subscription && (
            <CardContent>
              <div className="text-sm font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(subscription.currentPeriodEnd) > new Date()
                  ? "Vigente"
                  : "Vencido"}
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Tab Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Detalles y configuración del tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold">Tenant</h4>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nombre
                    </p>
                    <p>{tenant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Slug
                    </p>
                    <p>{tenant.slug}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Estado
                    </p>
                    <Badge
                      variant={
                        tenant.status === "active" ? "default" : "destructive"
                      }
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Fecha creación
                    </p>
                    <p>{new Date(tenant.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Plan actual
                    </p>
                    <p className="font-medium">{plan?.name || "Sin plan"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Owner</h4>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nombre
                    </p>
                    <p>{owner?.name || "Sin owner asignado"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Correo
                    </p>
                    <p>{owner?.email || "Sin correo"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Estado
                    </p>
                    <p>{owner?.status || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Owner ID
                    </p>
                    <p className="break-all">{owner?.id || "N/A"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="text-yellow-600">
                  <Repeat className="h-4 w-4 mr-2" />
                  Cambiar plan
                </Button>
                {tenant.status === "active" ? (
                  <Button variant="outline" size="sm" className="text-red-600">
                    <Ban className="h-4 w-4 mr-2" />
                    Suspender
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600"
                  >
                    Activar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Subscription */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Suscripción</CardTitle>
              <CardDescription>
                Información del plan y facturación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription && plan ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Plan
                      </p>
                      <p className="font-medium">{plan.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Precio
                      </p>
                      <p>
                        {subscription.billingCycle === "monthly"
                          ? `S/ ${plan.priceMonthly}/mes`
                          : `S/ ${plan.priceYearly}/año`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Ciclo
                      </p>
                      <Badge variant="secondary">
                        {subscription.billingCycle === "monthly"
                          ? "Mensual"
                          : "Anual"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Estado
                      </p>
                      <Badge
                        variant={
                          subscription.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Inicio
                      </p>
                      <p>
                        {new Date(subscription.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Período actual
                      </p>
                      <p>
                        {new Date(
                          subscription.currentPeriodStart,
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          subscription.currentPeriodEnd,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    {subscription.trialEndsAt && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Fin del trial
                        </p>
                        <p>
                          {new Date(
                            subscription.trialEndsAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Proveedor
                      </p>
                      <p className="capitalize">{subscription.provider}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No hay suscripción activa</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Usage */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uso vs Límites del Plan</CardTitle>
              <CardDescription>
                Comparación del consumo actual contra los límites del plan{" "}
                {plan?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Usuarios</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.users.used} / {usage.users.limit}
                  </span>
                </div>
                <Progress
                  value={(usage.users.used / usage.users.limit) * 100}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Sucursales</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.branches.used} / {usage.branches.limit}
                  </span>
                </div>
                <Progress
                  value={(usage.branches.used / usage.branches.limit) * 100}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Productos</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.products.used} / {usage.products.limit}
                  </span>
                </div>
                <Progress
                  value={(usage.products.used / usage.products.limit) * 100}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Clientes</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.clients.used} / {usage.clients.limit}
                  </span>
                </div>
                <Progress
                  value={(usage.clients.used / usage.clients.limit) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Branches (placeholder) */}
        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle>Sucursales</CardTitle>
              <CardDescription>Lista de sucursales del tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Próximamente...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Users (placeholder) */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>Usuarios del tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Próximamente...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

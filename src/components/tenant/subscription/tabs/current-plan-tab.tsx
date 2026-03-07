// components/subscription/tabs/current-plan-tab.tsx
"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { Progress } from "@/components/ui/progress";

import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  ArrowRight,
  RotateCcw,
  CalendarSync,
  Computer,
} from "lucide-react";
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";
import { PlanWithFeatures } from "@/src/adapters/subscription-adapter";
import { formatCurrency } from "@/src/utils/currency-format";

interface CurrentPlanTabProps {
  subscription: TenantSubscription;
  currentPlan: {
    name: string;
    description?: string;
    priceMonthly: number;
    priceYearly?: number;
  };
  currentPlanWithFeatures: PlanWithFeatures;
  currentUsage: {
    users: number;
    branches: number;
    products: number;
    clients: number;
    inventoryItems: number;
  };
  onOpenChangePlan: () => void;
  onOpenCancelModal: () => void;
}

export function CurrentPlanTab({
  subscription,
  currentPlan,
  currentPlanWithFeatures,
  currentUsage,
  onOpenChangePlan,
  onOpenCancelModal,
}: CurrentPlanTabProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      active: { color: "bg-green-500", text: "Activo" },
      trial: { color: "bg-blue-500", text: "Prueba" },
      past_due: { color: "bg-red-500", text: "Vencido" },
      canceled: { color: "bg-gray-500", text: "Cancelado" },
    };
    const statusInfo =
      variants[status as keyof typeof variants] || variants.active;

    return (
      <Badge className={`${statusInfo.color} hover:${statusInfo.color}`}>
        {statusInfo.text}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "dd MMM yyyy", { locale: es });
  };

  const getCycleLabel = (cycle: string) => {
    return cycle === "monthly" ? "Mensual" : "Anual";
  };

  const moduleModeLabel: Record<string, string> = {
    all: "Ventas + Alquileres",
    sales_only: "Solo Ventas",
    rentals_only: "Solo Alquileres",
    none: "Sin módulos operativos",
  };

  const featureLabels: Record<string, string> = {
    analytics: "Analytics",
    promotions: "Promociones",
    referrals: "Referidos",
    referralRewards: "Recompensas por referidos",
    loyalty: "Programa de lealtad",
  };

  const limitLabels: Record<string, string> = {
    users: "Usuarios",
    branches: "Sucursales",
    products: "Productos",
    clients: "Clientes",
    inventoryItems: "Items de inventario",
  };

  const getProgressColor = (current: number, limit: number) => {
    if (limit === -1) return "bg-green-500";
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 gap-6">
      {/* Columna principal - Info del plan */}
      <div className=" space-y-6">
        {/* Tarjeta del plan actual */}
        <Card>
          <CardHeader>
            <div className="flex  gap-12 items-start pt-3">
              <div>
                <CardTitle className="text-2xl">{currentPlan.name}</CardTitle>
                <CardDescription className="mt-1">
                  {currentPlan.description}
                </CardDescription>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Inicio:</span>
                <span className="font-medium">
                  {formatDate(subscription.startedAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Renovación:</span>
                <span className="font-medium">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarSync className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ciclo:</span>
                <span className="font-medium">
                  {getCycleLabel(subscription.billingCycle)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Precio:</span>
                <span className="font-medium">
                  {formatCurrency(
                    subscription.billingCycle === "monthly"
                      ? currentPlan.priceMonthly
                      : currentPlan.priceYearly ||
                          currentPlan.priceMonthly * 10,
                  )}{" "}
                  / {subscription.billingCycle === "monthly" ? "mes" : "año"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Computer className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Módulo:</span>
                <span className="font-medium">
                  {moduleModeLabel[currentPlanWithFeatures.modules.mode]}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="grid  grid-cols-1 gap-8 border-t pb-2">
            <Button onClick={onOpenChangePlan} className="-mt-4">
              Cambiar plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={onOpenCancelModal}
              className="-mt-4"
            >
              Cancelar suscripción
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div>
        {/* Features habilitadas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl border-b pb-4 pt-3">Características del plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
              {Object.entries(currentPlanWithFeatures.features).map(
                ([key, enabled]) => (
                  <div key={key} className="flex items-center gap-2">
                    {enabled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-300" />
                    )}
                    <span className={enabled ? "" : "text-muted-foreground"}>
                      {featureLabels[key]}
                    </span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Columna lateral - Uso del plan */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl border-b pb-4 pt-3">Uso del plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(currentPlanWithFeatures.limits).map(
              ([key, limit]) => {
                if (limit === 0) return null;

                const current =
                  currentUsage[key as keyof typeof currentUsage] || 0;
                const percentage = limit === -1 ? 0 : (current / limit) * 100;
                const isUnlimited = limit === -1;
                const showWarning = !isUnlimited && percentage >= 75;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {limitLabels[key]}
                      </span>
                      <span className="font-medium">
                        {current} / {isUnlimited ? "ilimitado" : limit}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <Progress
                        value={percentage}
                        className={`h-2 ${getProgressColor(current, limit)}`}
                      />
                    )}
                    {showWarning && (
                      <p className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Cerca del límite
                      </p>
                    )}
                  </div>
                );
              },
            )}

            {Object.values(currentPlanWithFeatures.limits).every(
              (l) => l === -1,
            ) && (
              <p className="text-center text-muted-foreground py-4">
                Plan sin límites definidos
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

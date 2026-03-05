// components/subscription/tabs/available-plans-tab.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  PlanWithFeatures,
  formatLimit,
} from "@/src/adapters/subscription-adapter";
import { formatCurrency } from "@/src/utils/currency-format";

interface AvailablePlansTabProps {
  plans: PlanWithFeatures[];
  currentPlanId: string;
  onSelectPlan: (planId: string) => void;
}

export function AvailablePlansTab({
  plans,
  currentPlanId,
  onSelectPlan,
}: AvailablePlansTabProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const featureLabels: Record<string, string> = {
    analytics: "Analytics",
    promotions: "Promociones",
    referrals: "Referidos",
    referralRewards: "Recompensas",
    loyalty: "Lealtad",
  };

  const limitLabels: Record<string, string> = {
    users: "Usuarios",
    branches: "Sucursales",
    products: "Productos",
    clients: "Clientes",
    inventoryItems: "Items",
  };

  const getPrice = (plan: PlanWithFeatures) => {
    if (billingCycle === "monthly") return plan.priceMonthly;
    return plan.priceYearly || plan.priceMonthly * 10;
  };

  const getSavings = (plan: PlanWithFeatures) => {
    if (!plan.priceYearly) return null;
    const monthlyTotal = plan.priceMonthly * 12;
    const yearlyTotal = plan.priceYearly;
    const savings = monthlyTotal - yearlyTotal;
    return savings > 0 ? savings : null;
  };

  const moduleModeLabel: Record<string, string> = {
    all: "Ventas + Alquileres",
    sales_only: "Solo Ventas",
    rentals_only: "Solo Alquileres",
    none: "Sin módulos",
  };

  const sectionByMode: Record<
    "all" | "rentals_only" | "sales_only" | "none",
    { title: string; plans: PlanWithFeatures[] }
  > = {
    all: { title: "Sistema Completo", plans: [] },
    rentals_only: { title: "Solo Alquiler", plans: [] },
    sales_only: { title: "Solo Ventas", plans: [] },
    none: { title: "Otros", plans: [] },
  };

  for (const plan of plans) {
    sectionByMode[plan.modules.mode].plans.push(plan);
  }

  const orderedSections = [
    sectionByMode.all,
    sectionByMode.rentals_only,
    sectionByMode.sales_only,
  ].filter((section) => section.plans.length > 0);

  return (
    <div className="space-y-6">
      {/* Selector de ciclo de facturación */}
      <div className="flex justify-center">
        <Tabs
          value={billingCycle}
          onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Mensual</TabsTrigger>
            <TabsTrigger value="yearly">
              Anual
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-700 border-green-200"
              >
                Ahorra 20%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {orderedSections.map((section) => (
        <div key={section.title} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{section.title}</h3>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {section.plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlanId;
              const price = getPrice(plan);
              const savings = getSavings(plan);

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    isCurrentPlan ? "border-2 border-primary shadow-lg" : ""
                  }`}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                      Plan actual
                    </Badge>
                  )}

                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <Badge variant="outline" className="mt-2 w-fit">
                      {moduleModeLabel[plan.modules.mode]}
                    </Badge>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-6">
                    {/* Precio */}
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {formatCurrency(price)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{billingCycle === "monthly" ? "mes" : "año"}
                        </span>
                      </p>
                      {savings && (
                        <p className="text-xs text-green-600 mt-1">
                          Ahorras {formatCurrency(savings)} al año
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Features */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Características</p>
                      {Object.entries(plan.features).map(([key, enabled]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          {enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 shrink-0" />
                          )}
                          <span className={enabled ? "" : "text-muted-foreground"}>
                            {featureLabels[key]}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Límites */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Límites</p>
                      {Object.entries(plan.limits).map(([key, limit]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {limitLabels[key]}
                          </span>
                          <span className="font-medium">{formatLimit(limit)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? "outline" : "default"}
                      onClick={() => onSelectPlan(plan.id)}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? "Plan actual" : "Cambiar a este plan"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

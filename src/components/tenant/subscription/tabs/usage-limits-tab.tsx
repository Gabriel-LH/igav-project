// components/subscription/tabs/usage-limits-tab.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users,
  Store,
  Package,
  Users2,
  Boxes,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  getProgressPercentage,
  getLimitStatus,
  formatLimit,
} from "@/src/adapters/subscription-adapter";

interface UsageLimitsTabProps {
  usage: {
    users: number;
    branches: number;
    products: number;
    clients: number;
    inventoryItems: number;
  };
  limits: {
    users: number;
    branches: number;
    products: number;
    clients: number;
    inventoryItems: number;
  };
  currentPlanName: string;
  onUpgrade: () => void;
}

export function UsageLimitsTab({
  usage,
  limits,
  currentPlanName,
  onUpgrade,
}: UsageLimitsTabProps) {
  const limitItems = [
    {
      key: "users",
      label: "Usuarios",
      icon: Users,
      current: usage.users,
      limit: limits.users,
    },
    {
      key: "branches",
      label: "Sucursales",
      icon: Store,
      current: usage.branches,
      limit: limits.branches,
    },
    {
      key: "products",
      label: "Productos",
      icon: Package,
      current: usage.products,
      limit: limits.products,
    },
    {
      key: "clients",
      label: "Clientes",
      icon: Users2,
      current: usage.clients,
      limit: limits.clients,
    },
    {
      key: "inventoryItems",
      label: "Items de inventario",
      icon: Boxes,
      current: usage.inventoryItems,
      limit: limits.inventoryItems,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "danger":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-green-600";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "danger":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  // Detectar límites cercanos
  const nearLimitItems = limitItems.filter((item) => {
    if (item.limit === -1) return false;
    const percentage = (item.current / item.limit) * 100;
    return percentage >= 75;
  });

  return (
    <div className="space-y-6">
      {/* Alerta de límites cercanos */}
      {nearLimitItems.length > 0 && (
        <Alert
          variant="default"
          className="border-amber-500 bg-amber-50 dark:bg-amber-950/20"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">
            Estás cerca de algunos límites
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            {nearLimitItems.map((item) => item.label).join(", ")}. Considera
            actualizar tu plan para seguir creciendo.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de límites */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {limitItems.map((item) => {
          const status = getLimitStatus(item.current, item.limit);
          const percentage = getProgressPercentage(item.current, item.limit);
          const Icon = item.icon;
          const isUnlimited = item.limit === -1;

          return (
            <Card key={item.key}>
              <CardHeader className="pt-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold">
                      {item.current}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        / {isUnlimited ? "∞" : item.limit}
                      </span>
                    </span>
                    {!isUnlimited && (
                      <span
                        className={`text-sm font-medium ${getStatusColor(status)}`}
                      >
                        {Math.round(percentage)}% usado
                      </span>
                    )}
                  </div>

                  {!isUnlimited && (
                    <Progress
                      value={percentage}
                      className={`h-2 ${getProgressColor(status)}`}
                    />
                  )}

                  {status === "danger" && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      Límite casi alcanzado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recomendación de upgrade */}
      {nearLimitItems.length > 0 && (
        <Card className="bg-linear-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">¿Necesitas más?</h3>
                  <p className="text-muted-foreground">
                    Tu plan actual {currentPlanName} tiene límites que estás
                    alcanzando. Actualiza a un plan superior para seguir
                    escalando tu negocio.
                  </p>
                </div>
              </div>
              <Button onClick={onUpgrade} size="lg" className="shrink-0">
                Ver planes disponibles
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

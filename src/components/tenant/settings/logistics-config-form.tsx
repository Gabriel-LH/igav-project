"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Route, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type {
  TenantConfig,
  TransferRouteConfig,
} from "@/src/types/tenant/type.tenantConfig";
import type { Branch } from "@/src/types/branch/type.branch";
import { getBranchesAction } from "@/src/app/(tenant)/tenant/actions/branch.actions";

interface LogisticsConfigFormProps {
  config: TenantConfig;
  onChange: (values: Partial<TenantConfig>) => void;
}

type BranchPair = {
  key: string;
  origin: Branch;
  destination: Branch;
};

function buildBranchPairs(branches: Branch[]): BranchPair[] {
  const activeBranches = branches.filter((branch) => branch.status === "active");
  const pairs: BranchPair[] = [];

  for (let index = 0; index < activeBranches.length; index += 1) {
    for (let inner = index + 1; inner < activeBranches.length; inner += 1) {
      const origin = activeBranches[index];
      const destination = activeBranches[inner];

      pairs.push({
        key: [origin.id, destination.id].sort().join("__"),
        origin,
        destination,
      });
    }
  }

  return pairs;
}

function findRoute(
  routes: TransferRouteConfig[],
  originBranchId: string,
  destinationBranchId: string,
) {
  return routes.find(
    (route) =>
      (route.originBranchId === originBranchId &&
        route.destinationBranchId === destinationBranchId) ||
      (route.originBranchId === destinationBranchId &&
        route.destinationBranchId === originBranchId),
  );
}

export function LogisticsConfigForm({
  config,
  onChange,
}: LogisticsConfigFormProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBranches() {
      setIsLoading(true);
      try {
        const result = await getBranchesAction();
        if (result.success && result.data) {
          setBranches(result.data as Branch[]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadBranches();
  }, []);

  const pairs = useMemo(() => buildBranchPairs(branches), [branches]);
  const routes = config.transferRoutes ?? [];

  const updateDefaultTransferTime = (value: number) => {
    onChange({
      defaultTransferTime: value,
    });
  };

  const updateRoute = (
    originBranchId: string,
    destinationBranchId: string,
    updates: Partial<TransferRouteConfig>,
  ) => {
    const existingRoute = findRoute(
      routes,
      originBranchId,
      destinationBranchId,
    );

    const nextRoute: TransferRouteConfig = {
      id:
        existingRoute?.id ??
        `route-${[originBranchId, destinationBranchId].sort().join("-")}`,
      originBranchId,
      destinationBranchId,
      estimatedTimeHours:
        existingRoute?.estimatedTimeHours ?? config.defaultTransferTime,
      status: existingRoute?.status ?? "active",
      ...updates,
    };

    const nextRoutes = existingRoute
      ? routes.map((route) => (route.id === existingRoute.id ? nextRoute : route))
      : [...routes, nextRoute];

    onChange({
      transferRoutes: nextRoutes,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="mt-3 flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Logistica Entre Sucursales
          </CardTitle>
          <CardDescription>
            Configura un tiempo general de traslado y sobrescribe rutas puntuales entre sedes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="defaultTransferTime">Tiempo por defecto (horas)</Label>
            <Input
              id="defaultTransferTime"
              type="number"
              min="0"
              step="0.5"
              value={config.defaultTransferTime}
              onChange={(event) =>
                updateDefaultTransferTime(Number(event.target.value) || 0)
              }
            />
            <p className="text-sm text-muted-foreground">
              Se usa cuando una ruta entre dos sucursales aun no tiene configuracion propia.
            </p>
          </div>

          <Separator />

          {isLoading ? (
            <div className="text-sm text-muted-foreground">
              Cargando sucursales para generar rutas...
            </div>
          ) : pairs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Necesitas al menos dos sucursales activas para configurar rutas logisticas.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Rutas configurables</h3>
                  <p className="text-sm text-muted-foreground">
                    Cada fila representa una ruta bidireccional entre dos sucursales.
                  </p>
                </div>
                <Badge variant="outline">{pairs.length} rutas</Badge>
              </div>

              <div className="space-y-3">
                {pairs.map((pair) => {
                  const route = findRoute(
                    routes,
                    pair.origin.id,
                    pair.destination.id,
                  );

                  return (
                    <div
                      key={pair.key}
                      className="rounded-xl border mb-3 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Route className="h-4 w-4 text-muted-foreground" />
                            {pair.origin.name}
                            <span className="text-muted-foreground">{"<->"}</span>
                            {pair.destination.name}
                          </div>

                          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {pair.origin.name}
                                </p>
                                <p>{pair.origin.address}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {pair.destination.name}
                                </p>
                                <p>{pair.destination.address}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                          <div className="w-full min-w-40 space-y-2">
                            <Label>Tiempo estimado (horas)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={
                                route?.estimatedTimeHours ??
                                config.defaultTransferTime
                              }
                              onChange={(event) =>
                                updateRoute(pair.origin.id, pair.destination.id, {
                                  estimatedTimeHours:
                                    Number(event.target.value) || 0,
                                })
                              }
                            />
                          </div>

                          <div className="flex min-w-40 items-center justify-between gap-3 rounded-lg border px-3 py-2">
                            <div>
                              <p className="text-sm font-medium">Ruta activa</p>
                              <p className="text-xs text-muted-foreground">
                                Si se desactiva, se usa el tiempo por defecto.
                              </p>
                            </div>
                            <Switch
                              checked={(route?.status ?? "inactive") === "active"}
                              onCheckedChange={(checked) =>
                                updateRoute(pair.origin.id, pair.destination.id, {
                                  status: checked ? "active" : "inactive",
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

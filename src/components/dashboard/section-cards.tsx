"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { getSectionCardMetrics } from "@/src/utils/dashboard/metrics";
import { useOperationStore } from "@/src/store/useOperationStore";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { FeatureGuard } from "@/src/components/guards/FeatureGuard";

export function SectionCards() {
  const operations = useOperationStore((s) => s.operations);
  const customers = useCustomerStore((s) => s.customers);
  const {
    totalIncome,
    incomeGrowthRate,
    newCustomersCount,
    customersGrowthRate,
    activeAccountsCount,
    activeGrowthRate,
    growthRate,
  } = getSectionCardMetrics(operations, customers);

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <FeatureGuard feature={["sales", "rentals"]} requireAll={false}>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Ingresos totales</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              S/. {totalIncome.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {Number(incomeGrowthRate) >= 0 ? (
                  <IconTrendingUp />
                ) : (
                  <IconTrendingDown />
                )}
                {Number(incomeGrowthRate) > 0 ? "+" : ""}
                {incomeGrowthRate}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {Number(incomeGrowthRate) >= 0
                ? "En tendencia este mes"
                : "Desaceleración este mes"}
              {Number(incomeGrowthRate) >= 0 ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
            </div>
            <div className="text-muted-foreground">
              Comparativa con el mes anterior
            </div>
          </CardFooter>
        </Card>
      </FeatureGuard>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Clientes nuevos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {newCustomersCount.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {Number(customersGrowthRate) >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {Number(customersGrowthRate) > 0 ? "+" : ""}
              {customersGrowthRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {Number(customersGrowthRate) >= 0
              ? `Crecimiento del ${customersGrowthRate}% este periodo`
              : `Descenso del ${Math.abs(Number(customersGrowthRate))}% este periodo`}
            {Number(customersGrowthRate) >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            {Number(customersGrowthRate) >= 0
              ? "Buena adquisición"
              : "Adquisición requiere atención"}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Cuentas activas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeAccountsCount.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {Number(activeGrowthRate) >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {Number(activeGrowthRate) > 0 ? "+" : ""}
              {activeGrowthRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {Number(activeGrowthRate) >= 50
              ? "Retención fuerte"
              : "Retención moderada"}
            {Number(activeGrowthRate) >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            {Number(activeGrowthRate) >= 50
              ? "El compromiso es fuerte"
              : "Oportunidad de fidelización"}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tasa de crecimiento</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {growthRate}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {growthRate}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Aumento constante <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Proyección de crecimiento cumplida
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

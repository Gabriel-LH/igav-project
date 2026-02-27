"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { FeatureGuard } from "@/src/components/guards/FeatureGuard";

import { useAnalyticsData } from "@/src/hooks/useAnalyticsData";

const chartConfig = {
  rentals: { label: "Alquileres", color: "#22c55e" },
  sales: { label: "Ventas", color: "#3b82f6" },
} satisfies ChartConfig;

export function PriceVsRotationChart() {
  const [mode, setMode] = useState<"rentals" | "sales" | "both">("rentals");
  const { priceRotationData: data, hasSalesFeature } = useAnalyticsData();

  const activeMode = !hasSalesFeature && mode !== "rentals" ? "rentals" : mode;

  const rentalsData = data.filter((d) => d.type === "rental");
  const salesData = data.filter((d) => d.type === "sale");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Precio vs. Rotación</CardTitle>
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList>
            <FeatureGuard feature="rentals">
              <TabsTrigger value="rentals">Alquileres</TabsTrigger>
            </FeatureGuard>
            <FeatureGuard feature="sales">
              <TabsTrigger value="sales">Ventas</TabsTrigger>
            </FeatureGuard>
            <FeatureGuard feature={["rentals", "sales"]} requireAll>
              <TabsTrigger value="both">Ambos</TabsTrigger>
            </FeatureGuard>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          {/* Usamos ScatterChart directamente */}
          <ScatterChart margin={{ top: 20, left: 12, right: 12 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--muted-foreground)/0.2)"
            />

            <XAxis
              type="number"
              unit="S/"
              dataKey="price"
              name="Precio"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              type="number"
              dataKey="rotation"
              name="Rotación"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            {/* El ZAxis ayuda a definir el radio de los puntos si quisieras variarlo */}
            <ZAxis range={[64, 64]} />

            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<ChartTooltipContent />}
            />

            {(activeMode === "rentals" || activeMode === "both") && (
              <Scatter
                name="Alquileres"
                data={rentalsData}
                fill={chartConfig.rentals.color}
                shape="circle"
              />
            )}

            {(activeMode === "sales" || activeMode === "both") && (
              <Scatter
                name="Ventas"
                data={salesData}
                fill={chartConfig.sales.color}
                shape="circle"
              />
            )}
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

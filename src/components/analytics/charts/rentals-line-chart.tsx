// components/analytics/charts/rentals-line-chart.tsx
"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { SortedTooltipContent } from "../../dashboard/ui/sorted-tootip-content";

// mock data
const rentalsData = [
  { month: "Enero", revenue: 1200 },
  { month: "Febrero", revenue: 800 },
  { month: "Marzo", revenue: 1600 },
  { month: "Abril", revenue: 1400 },
];

const salesData = [
  { month: "Enero", revenue: 1300 },
  { month: "Febrero", revenue: 1200 },
  { month: "Marzo", revenue: 1800 },
  { month: "Abril", revenue: 2000 },
];

const chartData = rentalsData.map((item, index) => ({
  month: item.month,
  rentals: item.revenue,
  sales: salesData[index].revenue,
}));

const chartConfig = {
  rentals: {
    label: "Alquileres",
    color: "#2563eb",
  },
  sales: {
    label: "Ventas",
    color: "#10b981",
  },
} satisfies ChartConfig;

export function RentalsLineChart() {
  const [mode, setMode] = useState<"rentals" | "sales" | "both">("rentals");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ingresos por fecha</CardTitle>
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList>
            <TabsTrigger value="rentals">Alquileres</TabsTrigger>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="both">Ambos</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart data={chartData} margin={{ top: 20, left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              hide
              domain={[
                0,
                chartData.reduce(
                  (max, item) => Math.max(max, item.rentals, item.sales) + 200,
                  0
                ),
              ]}
            />
            <ChartTooltip content={<SortedTooltipContent />} />

            {/* Renderizado condicional basado en el modo */}
            {(mode === "rentals" || mode === "both") && (
              <Line
                dataKey="rentals"
                type="natural"
                stroke={chartConfig.rentals.color}
                strokeWidth={2}
                dot={false}
              />
            )}
            {(mode === "sales" || mode === "both") && (
              <Line
                dataKey="sales"
                type="natural"
                stroke={chartConfig.sales.color}
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

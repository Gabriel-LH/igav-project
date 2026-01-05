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

const data = [
  { name: "Vestido A", price: 120, rotation: 12, type: "rental" },
  { name: "Vestido B", price: 250, rotation: 4, type: "sale" },
  { name: "Traje C", price: 180, rotation: 8, type: "rental" },
  { name: "Vestido D", price: 90, rotation: 20, type: "sale" },
  { name: "Traje E", price: 210, rotation: 14, type: "rental" },
];

const chartConfig = {
  rentals: { label: "Alquileres", color: "#22c55e" },
  sales: { label: "Ventas", color: "#3b82f6" },
} satisfies ChartConfig;

export function PriceVsRotationChart() {
  const [mode, setMode] = useState<"rentals" | "sales" | "both">("rentals");

  // Filtramos los datos según el tab seleccionado
  const rentalsData = data.filter((d) => d.type === "rental");
  const salesData = data.filter((d) => d.type === "sale");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Precio vs. Rotación</CardTitle>
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

            {(mode === "rentals" || mode === "both") && (
              <Scatter
                name="Alquileres"
                data={rentalsData}
                fill={chartConfig.rentals.color}
                shape="circle"
              />
            )}

            {(mode === "sales" || mode === "both") && (
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

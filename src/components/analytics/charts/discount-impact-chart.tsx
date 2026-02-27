"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAnalyticsData } from "@/src/hooks/useAnalyticsData";
import { SortedTooltipContent } from "../../dashboard/ui/sorted-tootip-content";

const chartConfig = {
  sinDescuento: {
    label: "Ingresos Base (Sin desc.)",
    color: "#94a3b8", // muted grey
  },
  conDescuento: {
    label: "Ingresos Netos (Con desc.)",
    color: "#eab308", // warning yellow
  },
} satisfies ChartConfig;

export function DiscountImpactChart() {
  const { discountData: chartData } = useAnalyticsData();

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Impacto de Descuentos vs Ingresos Maximizados</CardTitle>
        <CardDescription>
          Compara el total que se hubiera percibido sin aplicar descuentos
          frente al ingreso real.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[350px] w-full">
          <BarChart data={chartData} margin={{ top: 20, left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis hide />
            <ChartTooltip content={<SortedTooltipContent />} />

            <Bar
              dataKey="sinDescuento"
              fill={chartConfig.sinDescuento.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="conDescuento"
              fill={chartConfig.conDescuento.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/src/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group";
import { SortedTooltipContent } from "./ui/sorted-tootip-content";
import { FeatureGuard } from "@/src/components/guards/FeatureGuard";

import { getChartAreaMetrics } from "@/src/utils/dashboard/metrics";
import { useOperationStore } from "@/src/store/useOperationStore";

export const description = "An interactive area chart";

const chartConfig = {
  clientes: {
    label: "Clientes",
  },
  alquiler: {
    label: "Alquiler",
    color: "#2563eb",
  },
  venta: {
    label: "Venta",
    color: "#10b981",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const operations = useOperationStore((s) => s.operations);
  const chartData = React.useMemo(
    () => getChartAreaMetrics(operations),
    [operations],
  );

  const [timeRange, setTimeRange] = React.useState("now");
  const [timeRange2, setTimeRange2] = React.useState("hoy");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    if (chartData.length === 0) return false;
    const date = new Date(item.date);
    const referenceDate = new Date(chartData[chartData.length - 1].date);

    if (timeRange === "now") {
      // Using only pure YYYY-MM-DD string comparisons might be safer, but Date objects work for range if parsed safely.
      // Easiest is to compare the ISO strings up to day
      return (
        date.toISOString().split("T")[0] ===
        referenceDate.toISOString().split("T")[0]
      );
    }

    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    else if (timeRange === "7d") daysToSubtract = 7;

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total de movimientos</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total de {timeRange2}
          </span>
          <span className="@[540px]/card:hidden">{timeRange2}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem onClick={() => setTimeRange2("hoy")} value="now">
              Hoy
            </ToggleGroupItem>
            <ToggleGroupItem
              onClick={() => setTimeRange2("los últimos 7 días")}
              value="7d"
            >
              Últimos 7 días
            </ToggleGroupItem>
            <ToggleGroupItem
              onClick={() => setTimeRange2("los últimos 30 días")}
              value="30d"
            >
              Últimos 30 días
            </ToggleGroupItem>
            <ToggleGroupItem
              onClick={() => setTimeRange2("los últimos 3 meses")}
              value="90d"
            >
              Últimos 3 meses
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Selecciona un rango de tiempo"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="now" className="rounded-lg">
                Hoy
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 días
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 días
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData} accessibilityLayer>
            <defs>
              <linearGradient id="fillVenta" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-venta)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-venta)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAlquiler" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-alquiler)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-alquiler)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("es-ES", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip cursor={false} content={<SortedTooltipContent />} />
            <FeatureGuard feature="sales">
              <Area
                dataKey="venta"
                type="natural"
                fill="url(#fillVenta)"
                stroke="var(--color-venta)"
              />
            </FeatureGuard>
            <FeatureGuard feature="rentals">
              <Area
                dataKey="alquiler"
                type="natural"
                fill="url(#fillAlquiler)"
                stroke="var(--color-alquiler)"
              />
            </FeatureGuard>
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

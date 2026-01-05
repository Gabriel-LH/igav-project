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
  ChartTooltipContent,
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

export const description = "An interactive area chart";

const chartData = [
  { date: "2025-04-01", alquiler: 222, venta: 150 },
  { date: "2025-04-02", alquiler: 97, venta: 180 },
  { date: "2025-04-03", alquiler: 167, venta: 120 },
  { date: "2025-04-04", alquiler: 242, venta: 260 },
  { date: "2025-04-05", alquiler: 373, venta: 290 },
  { date: "2025-04-06", alquiler: 301, venta: 340 },
  { date: "2025-04-07", alquiler: 245, venta: 180 },
  { date: "2025-04-08", alquiler: 409, venta: 320 },
  { date: "2025-04-09", alquiler: 59, venta: 110 },
  { date: "2025-04-10", alquiler: 261, venta: 190 },
  { date: "2025-04-11", alquiler: 327, venta: 350 },
  { date: "2025-04-12", alquiler: 292, venta: 210 },
  { date: "2025-04-13", alquiler: 342, venta: 380 },
  { date: "2025-04-14", alquiler: 137, venta: 220 },
  { date: "2025-04-15", alquiler: 120, venta: 170 },
  { date: "2025-04-16", alquiler: 138, venta: 190 },
  { date: "2025-04-17", alquiler: 446, venta: 360 },
  { date: "2025-04-18", alquiler: 364, venta: 410 },
  { date: "2025-04-19", alquiler: 243, venta: 180 },
  { date: "2025-04-20", alquiler: 89, venta: 150 },
  { date: "2025-04-21", alquiler: 137, venta: 200 },
  { date: "2025-04-22", alquiler: 224, venta: 170 },
  { date: "2025-04-23", alquiler: 138, venta: 230 },
  { date: "2025-04-24", alquiler: 387, venta: 290 },
  { date: "2025-04-25", alquiler: 215, venta: 250 },
  { date: "2025-04-26", alquiler: 75, venta: 130 },
  { date: "2025-04-27", alquiler: 383, venta: 420 },
  { date: "2025-04-28", alquiler: 122, venta: 180 },
  { date: "2025-04-29", alquiler: 315, venta: 240 },
  { date: "2025-04-30", alquiler: 454, venta: 380 },
  { date: "2025-05-01", alquiler: 165, venta: 220 },
  { date: "2025-05-02", alquiler: 293, venta: 310 },
  { date: "2025-05-03", alquiler: 247, venta: 190 },
  { date: "2025-05-04", alquiler: 385, venta: 420 },
  { date: "2025-05-05", alquiler: 481, venta: 390 },
  { date: "2025-05-06", alquiler: 498, venta: 520 },
  { date: "2025-05-07", alquiler: 388, venta: 300 },
  { date: "2025-05-08", alquiler: 149, venta: 210 },
  { date: "2025-05-09", alquiler: 227, venta: 180 },
  { date: "2025-05-10", alquiler: 293, venta: 330 },
  { date: "2025-05-11", alquiler: 335, venta: 270 },
  { date: "2025-05-12", alquiler: 197, venta: 240 },
  { date: "2025-05-13", alquiler: 197, venta: 160 },
  { date: "2025-05-14", alquiler: 448, venta: 490 },
  { date: "2025-05-15", alquiler: 473, venta: 380 },
  { date: "2025-05-16", alquiler: 338, venta: 400 },
  { date: "2025-05-17", alquiler: 499, venta: 420 },
  { date: "2025-05-18", alquiler: 315, venta: 350 },
  { date: "2025-05-19", alquiler: 235, venta: 180 },
  { date: "2025-05-20", alquiler: 177, venta: 230 },
  { date: "2025-05-21", alquiler: 82, venta: 140 },
  { date: "2025-05-22", alquiler: 81, venta: 120 },
  { date: "2025-05-23", alquiler: 252, venta: 290 },
  { date: "2025-05-24", alquiler: 294, venta: 220 },
  { date: "2025-05-25", alquiler: 201, venta: 250 },
  { date: "2025-05-26", alquiler: 213, venta: 170 },
  { date: "2025-05-27", alquiler: 420, venta: 460 },
  { date: "2025-05-28", alquiler: 233, venta: 190 },
  { date: "2025-05-29", alquiler: 78, venta: 130 },
  { date: "2025-05-30", alquiler: 340, venta: 280 },
  { date: "2025-05-31", alquiler: 178, venta: 230 },
  { date: "2025-06-01", alquiler: 178, venta: 200 },
  { date: "2025-06-02", alquiler: 470, venta: 410 },
  { date: "2025-06-03", alquiler: 103, venta: 160 },
  { date: "2025-06-04", alquiler: 439, venta: 380 },
  { date: "2025-06-05", alquiler: 88, venta: 140 },
  { date: "2025-06-06", alquiler: 294, venta: 250 },
  { date: "2025-06-07", alquiler: 323, venta: 370 },
  { date: "2025-06-08", alquiler: 385, venta: 320 },
  { date: "2025-06-09", alquiler: 438, venta: 480 },
  { date: "2025-06-10", alquiler: 155, venta: 200 },
  { date: "2025-06-11", alquiler: 92, venta: 150 },
  { date: "2025-06-12", alquiler: 492, venta: 420 },
  { date: "2025-06-13", alquiler: 81, venta: 130 },
  { date: "2025-06-14", alquiler: 426, venta: 380 },
  { date: "2025-06-15", alquiler: 307, venta: 350 },
  { date: "2025-06-16", alquiler: 371, venta: 310 },
  { date: "2025-06-17", alquiler: 475, venta: 520 },
  { date: "2025-06-18", alquiler: 107, venta: 170 },
  { date: "2025-06-19", alquiler: 341, venta: 290 },
  { date: "2025-06-20", alquiler: 408, venta: 450 },
  { date: "2025-06-21", alquiler: 169, venta: 210 },
  { date: "2025-06-22", alquiler: 317, venta: 270 },
  { date: "2025-06-23", alquiler: 480, venta: 530 },
  { date: "2025-06-24", alquiler: 132, venta: 180 },
  { date: "2025-06-25", alquiler: 141, venta: 190 },
  { date: "2025-06-26", alquiler: 434, venta: 380 },
  { date: "2025-06-27", alquiler: 448, venta: 490 },
  { date: "2025-06-28", alquiler: 149, venta: 200 },
  { date: "2025-06-29", alquiler: 103, venta: 160 },
  { date: "2025-06-30", alquiler: 446, venta: 400 },
  { date: "2025-06-30", alquiler: 400, venta: 34 },
  { date: "2025-06-30", alquiler: 44, venta: 40 },
  { date: "2025-06-30", alquiler: 64, venta: 39 },
  { date: "2025-06-30", alquiler: 200, venta: 100 },
];

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
  const [timeRange, setTimeRange] = React.useState("now");
  const [timeRange2, setTimeRange2] = React.useState("últimos 3 meses");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date(chartData[chartData.length - 1].date);

    if (timeRange === "now") {
      return date.getTime() === referenceDate.getTime();
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
            Total de los {timeRange2}
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
              onClick={() => setTimeRange2("últimos 7 días")}
              value="7d"
            >
              Últimos 7 días
            </ToggleGroupItem>
            <ToggleGroupItem
              onClick={() => setTimeRange2("últimos 30 días")}
              value="30d"
            >
              Últimos 30 días
            </ToggleGroupItem>
            <ToggleGroupItem
              onClick={() => setTimeRange2("últimos 3 meses")}
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
            <Area
              dataKey="venta"
              type="natural"
              fill="url(#fillVenta)"
              stroke="var(--color-venta)"
            />
            <Area
              dataKey="alquiler"
              type="natural"
              fill="url(#fillAlquiler)"
              stroke="var(--color-alquiler)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

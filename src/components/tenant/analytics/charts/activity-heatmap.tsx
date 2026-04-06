"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAnalyticsData } from "@/src/hooks/useAnalyticsData";

interface HeatmapProps {
  dataLevel?: "category" | "product";
  selectedProduct?: string;
}

export function ActivityHeatmap({
  dataLevel = "category",
  selectedProduct,
}: HeatmapProps) {
  const [mode, setMode] = useState<"rentals" | "sales" | "both">("both");
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  const { heatmapData: mockRevenue, hasSalesFeature } = useAnalyticsData();

  // Dynamically generate the last 31 days in DD/MM format
  const dates = useMemo(() => {
    const arr: string[] = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      arr.push(`${day}/${month}`);
    }
    return arr;
  }, []);

  const activeMode = !hasSalesFeature && (mode === "sales" || mode === "both") ? "rentals" : mode;

  const yAxisLabels = useMemo(() => {
    if (selectedProduct) return [selectedProduct];
    if (dataLevel === "product") {
      return Array.from(new Set(mockRevenue.map((item: any) => item.name)));
    }
    const cats = Array.from(
      new Set(mockRevenue.map((item: any) => item.category)),
    );
    return cats.length > 0 ? cats : ["General"];
  }, [dataLevel, selectedProduct, mockRevenue]);

  const { matrix, maxTotal } = useMemo(() => {
    const dataMatrix = yAxisLabels.map((label) => ({
      label: label as string,
      values: dates.map((date) => {
        const items = mockRevenue.filter(
          (r: any) =>
            (dataLevel === "category"
              ? r.category === label
              : r.name === label) && r.date === date,
        );
        const rentals = items.reduce((sum: number, i: any) => sum + (i.rentals || 0), 0);
        const sales = items.reduce((sum: number, i: any) => sum + (i.sales || 0), 0);
        return { date, rentals, sales };
      }),
    }));

    const max = Math.max(
      ...dataMatrix.flatMap((row) =>
        row.values.map((v) => {
          if (activeMode === "rentals") return v.rentals;
          if (activeMode === "sales") return v.sales;
          return v.rentals + v.sales;
        }),
      ),
      1,
    );

    return { matrix: dataMatrix, maxTotal: max };
  }, [activeMode, yAxisLabels, dataLevel, mockRevenue, dates]);

  const totalPages = Math.ceil(yAxisLabels.length / itemsPerPage);
  const paginatedMatrix = matrix.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage,
  );

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <CardTitle className="text-xl font-semibold">
          Actividad por{" "}
          {selectedProduct
            ? "Producto"
            : dataLevel === "category"
              ? "Categoría"
              : "Producto"}
        </CardTitle>
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList>
            <TabsTrigger value="rentals">Alquileres</TabsTrigger>
            {hasSalesFeature && (
              <>
                <TabsTrigger value="sales">Ventas</TabsTrigger>
                <TabsTrigger value="both">Ambos</TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <TooltipProvider delayDuration={0}>
          <ScrollArea className="w-full rounded-md border bg-muted/20 p-4">
            <div
              className="grid gap-y-2 min-w-[700px]"
              style={{
                gridTemplateColumns: `180px repeat(${dates.length}, 1fr)`,
              }}
            >
              <div className="text-[10px] font-bold uppercase text-muted-foreground self-center">
                Identificador
              </div>
              {dates.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold uppercase text-muted-foreground">
                  {d}
                </div>
              ))}

              {paginatedMatrix.map((row) => (
                <div key={row.label} className="contents group">
                  <div className="text-sm font-medium py-2 truncate pr-4 text-foreground group-hover:text-primary transition-colors">
                    {row.label}
                  </div>

                  {row.values.map((cell) => {
                    const val =
                      activeMode === "rentals" ? cell.rentals :
                      activeMode === "sales" ? cell.sales :
                      (cell.rentals + cell.sales);
                    
                    const intensity = val / maxTotal;

                    return (
                      <Tooltip key={cell.date}>
                        <TooltipTrigger asChild>
                          <div className="px-1 py-0.5">
                            <div
                              className={cn(
                                "h-10 w-full rounded-[4px] transition-all flex overflow-hidden border border-transparent shadow-sm",
                                val === 0 ? "bg-muted/40" : "",
                              )}
                              style={{
                                backgroundColor:
                                  val > 0
                                    ? activeMode === "sales"
                                      ? `rgba(59, 130, 246, ${Math.max(intensity, 0.15)})`
                                      : activeMode === "both"
                                      ? cell.rentals > 0 && cell.sales > 0
                                        ? `rgba(99, 102, 241, ${Math.max(intensity, 0.15)})` // Indigo: Both
                                        : cell.rentals > 0
                                        ? `rgba(34, 197, 94, ${Math.max(intensity, 0.15)})`  // Green: Only Rent
                                        : `rgba(59, 130, 246, ${Math.max(intensity, 0.15)})` // Blue: Only Sale
                                      : `rgba(34, 197, 94, ${Math.max(intensity, 0.15)})` // Green: Default Rentals
                                    : undefined,
                              }}
                            />
                          </div>
                        </TooltipTrigger>

                        <TooltipContent side="top" className="bg-popover text-popover-foreground border-border shadow-xl">
                          <div className="space-y-1.5 p-1 min-w-[140px]">
                            <p className="font-bold text-xs border-b border-border pb-1 mb-1">{row.label} - {cell.date}</p>
                            
                            {(activeMode === "rentals" || activeMode === "both") && cell.rentals > 0 && (
                              <div className="flex justify-between gap-6 text-[11px]">
                                <span className="text-muted-foreground">Alquileres:</span>
                                <span className="font-bold text-green-600">{cell.rentals}</span>
                              </div>
                            )}
                            {(activeMode === "sales" || activeMode === "both") && cell.sales > 0 && (
                              <div className="flex justify-between gap-6 text-[11px]">
                                <span className="text-muted-foreground">Ventas:</span>
                                <span className="font-bold text-blue-600">{cell.sales}</span>
                              </div>
                            )}
                            {activeMode === "both" && val > 0 && (
                              <div className="flex justify-between gap-6 text-[11px] pt-1 border-t border-border mt-1 font-bold">
                                <span>Total Actividad:</span>
                                <span>{val}</span>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TooltipProvider>

        <div className="mt-6 mb-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1 || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" /> Alquiler
              </div>
              {hasSalesFeature && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500" /> Venta
                </div>
              )}
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-indigo-500" /> Ambos
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

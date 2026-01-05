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

// Mock data extendido para probar paginación
const categories = [
  "Vestidos",
  "Trajes",
  "Casual",
  "Deportivo",
  "Fiesta",
  "Abrigos",
  "Informal",
  "Formal",
  "Niños",
  "Accesorios",
  "Zapatos",
  "Joyas",
  "Relojes",
  "Sombreros",
];
const dates = [
  "01/01",
  "02/01",
  "03/01",
  "04/01",
  "05/01",
  "06/01",
  "07/01",
  "08/01",
  "09/01",
  "10/01",
  "11/01",
  "12/01",
  "13/01",
  "14/01",
  "15/01",
  "16/01",
  "17/01",
  "18/01",
  "19/01",
  "20/01",
  "21/01",
  "22/01",
  "23/01",
  "24/01",
  "25/01",
  "26/01",
  "27/01",
  "28/01",
  "29/01",
  "30/01",
  "31/01",
];

const mockRevenue = [
  { name: "Item 1", category: "Vestidos", date: "01/01", rentals: 8, sales: 2 },
  { name: "Item 2", category: "Trajes", date: "01/01", rentals: 2, sales: 5 },
  // ... más datos
];

interface HeatmapProps {
  dataLevel?: "category" | "product"; // Controla qué se muestra en el eje Y
  selectedProduct?: string; // Si viene de un filtro externo
}

export function ActivityHeatmap({
  dataLevel = "category",
  selectedProduct,
}: HeatmapProps) {
  const [mode, setMode] = useState<"rentals" | "sales" | "both">("rentals");
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  // 1. Identificar qué etiquetas mostrar en el eje Y (Dinamismo)
  const yAxisLabels = useMemo(() => {
    if (selectedProduct) return [selectedProduct];
    if (dataLevel === "product") {
      // Extrae nombres únicos de productos del mockRevenue
      return Array.from(new Set(mockRevenue.map((item) => item.name)));
    }
    return categories; // Por defecto categorías
  }, [dataLevel, selectedProduct]);

  // 2. Procesar Matriz
  const { matrix, maxTotal } = useMemo(() => {
    const dataMatrix = yAxisLabels.map((label) => ({
      label: label,
      values: dates.map((date) => {
        const items = mockRevenue.filter(
          (r) =>
            (dataLevel === "category"
              ? r.category === label
              : r.name === label) && r.date === date
        );
        const rentals = items.reduce((sum, i) => sum + i.rentals, 0);
        const sales = items.reduce((sum, i) => sum + i.sales, 0);
        return { date, rentals, sales };
      }),
    }));

    const max = Math.max(
      ...dataMatrix.flatMap((row) =>
        row.values.map((v) =>
          mode === "rentals"
            ? v.rentals
            : mode === "sales"
            ? v.sales
            : v.rentals + v.sales
        )
      ),
      1
    );

    return { matrix: dataMatrix, maxTotal: max };
  }, [mode, yAxisLabels, dataLevel]);

  const totalPages = Math.ceil(yAxisLabels.length / itemsPerPage);
  const paginatedMatrix = matrix.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
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
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="both">Ambos</TabsTrigger>
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
              {/* Header con fechas */}
              <div className="text-[10px] font-bold uppercase text-muted-foreground self-center">
                Identificador
              </div>
              {dates.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-bold uppercase text-muted-foreground"
                >
                  {d}
                </div>
              ))}

              {/* Render de Filas */}
              {paginatedMatrix.map((row) => (
                <div key={row.label} className="contents group">
                  <div className="text-sm font-medium py-2 truncate pr-4 text-foreground group-hover:text-primary transition-colors">
                    {row.label}
                  </div>

                  {row.values.map((cell) => {
                    const val =
                      mode === "rentals"
                        ? cell.rentals
                        : mode === "sales"
                        ? cell.sales
                        : cell.rentals + cell.sales;
                    const intensity = val / maxTotal;

                    return (
                      <Tooltip key={cell.date}>
                        <TooltipTrigger asChild>
                          <div className="px-1 py-0.5">
                            <div
                              className={cn(
                                "h-10 w-full rounded-[4px] transition-all flex overflow-hidden border border-transparent shadow-sm",
                                val === 0 ? "bg-muted/40" : ""
                              )}
                              style={{
                                backgroundColor:
                                  val > 0
                                    ? mode === "sales"
                                      ? `rgba(59, 130, 246, ${intensity})`
                                      : `rgba(34, 197, 94, ${intensity})`
                                    : undefined,
                              }}
                            >
                              {mode === "both" && val > 0 && (
                                <>
                                  <div
                                    className="bg-green-500/60"
                                    style={{ flex: cell.rentals }}
                                  />
                                  <div
                                    className="bg-blue-600/60"
                                    style={{ flex: cell.sales }}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>

                        {/* CONTENIDO DINÁMICO DEL TOOLTIP */}
                        <TooltipContent
                          side="top"
                          className="bg-popover text-popover-foreground border-border shadow-xl"
                        >
                          <div className="space-y-1.5 p-1">
                            <p className="font-bold text-xs border-b border-border pb-1 mb-1">
                              {row.label}
                            </p>

                            {/* Mostrar solo lo que corresponde al modo */}
                            {(mode === "rentals" || mode === "both") && (
                              <div className="flex justify-between gap-6 text-[11px]">
                                <span className="text-muted-foreground font-medium">
                                  Alquileres:
                                </span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  {cell.rentals}
                                </span>
                              </div>
                            )}

                            {(mode === "sales" || mode === "both") && (
                              <div className="flex justify-between gap-6 text-[11px]">
                                <span className="text-muted-foreground font-medium">
                                  Ventas:
                                </span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {cell.sales}
                                </span>
                              </div>
                            )}

                            {mode === "both" && (
                              <div className="flex justify-between gap-6 text-[11px] pt-1 border-t border-border mt-1">
                                <span className="font-bold">Total:</span>
                                <span className="font-bold">
                                  {cell.rentals + cell.sales}
                                </span>
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

        {/* Paginación y Leyenda adaptativa */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
            <div className="flex items-center gap-1.5">
              <span>Menos</span>
              <div className="flex gap-0.5">
                {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
                  <div
                    key={o}
                    className="h-3 w-3 rounded-[2px] bg-slate-300"
                    style={{ opacity: o }}
                  />
                ))}
              </div>
              <span>Más</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" /> Alquiler
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" /> Venta
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

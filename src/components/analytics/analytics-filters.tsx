"use client";

import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search } from "lucide-react";

type TimeMode = "day" | "month" | "year";

const products = [
  { id: "1", name: "Vestido Negro Largo" },
  { id: "2", name: "Traje Azul" },
  { id: "3", name: "Vestido Rojo Corto" },
];

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function AnalyticsFilters() {
  const [timeMode, setTimeMode] = useState<TimeMode>("day");
  const [range, setRange] = useState<DateRange | undefined>();
  const [category, setCategory] = useState("all");
  const [product, setProduct] = useState<string | null>(null);
  const [productOpen, setProductOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
      {/* MODO TEMPORAL */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Modo temporal</span>
        <Tabs
          value={timeMode}
          onValueChange={(v) => setTimeMode(v as TimeMode)}
        >
          <TabsList>
            <TabsTrigger value="day">Día</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="year">Año</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* DÍA */}
      {timeMode === "day" && (
        <div className="flex flex-col gap-1">
          {" "}
          <span className="text-sm font-medium">Rango de fechas</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="font-normal" variant="outline">
                {range?.from && range?.to
                  ? `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
                  : "Rango (máx 31 días)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                disabled={(date) =>
                  !!(
                    range?.from &&
                    Math.abs(
                      (date.getTime() - range.from.getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) > 31
                  )
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* MES */}
      {timeMode === "month" && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Mes</span>
          <Select>
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Seleccionar mes(es)" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={String(i)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* AÑO */}
      {timeMode === "year" && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Año</span>
          <Select>
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Seleccionar año(s)" />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* CATEGORÍA */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Categoría</span>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-[160px] md:w-[160px] w-[135px]  ">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="dress">Vestidos</SelectItem>
            <SelectItem value="suit">Trajes</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* PRODUCTO */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Producto</span>
        <Popover open={productOpen} onOpenChange={setProductOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="sm:w-fit md:w-fit w-[160px] font-normal justify-start"
            >
              {product ? (
                products.find((p) => p.id === product)?.name
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar producto
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-fit p-0">
            <Command>
              <CommandInput placeholder="Buscar producto..." />
              <CommandList>
                {products.map((p) => (
                  <CommandItem
                    key={p.id}
                    onSelect={() => {
                      setProduct(p.id);
                      setProductOpen(false);
                    }}
                  >
                    {p.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button className="ml-auto">Aplicar filtros</Button>
    </div>
  );
}

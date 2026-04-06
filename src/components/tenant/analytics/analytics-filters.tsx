"use client";

import { useState } from "react";
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

import { useAnalyticsStore, type TimeMode } from "@/src/store/useAnalyticsStore";
import { useCategoryStore } from "@/src/store/useCategoryStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { flattenCategories, getDescendants } from "@/src/utils/category/categoryTree";
import { useMemo } from "react";

export function AnalyticsFilters() {
  const { tempFilters, setTempFilters, applyFilters } = useAnalyticsStore();
  const categories = useCategoryStore((s) => s.categories);
  const products = useInventoryStore((s) => s.products);
  const [productOpen, setProductOpen] = useState(false);

  // Hierarchy for selection
  const flatCats = useMemo(() => flattenCategories(categories), [categories]);

  // Filter products based on selected category (including subcategories)
  const filteredProducts = useMemo(() => {
    if (!tempFilters.categoryId || tempFilters.categoryId === "all") return products;
    const allowedIds = [tempFilters.categoryId, ...getDescendants(categories, tempFilters.categoryId)];
    return products.filter((p) => p.categoryId && allowedIds.includes(p.categoryId));
  }, [products, categories, tempFilters.categoryId]);

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const handleApply = () => {
    applyFilters();
  };

  // Helper to get formatted category label with indentation
  const getCategoryLabel = (cat: { label: string; level: number }) => {
    return `${"\u00A0".repeat(cat.level * 4)}${cat.level > 0 ? "└─ " : ""}${cat.label}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4 bg-card shadow-sm">
      {/* ... keeping other filters ... */}
      
      {/* MODO TEMPORAL */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase text-muted-foreground">Modo temporal</span>
        <Tabs
          value={tempFilters.timeMode}
          onValueChange={(v) => setTempFilters({ timeMode: v as TimeMode })}
        >
          <TabsList className="bg-muted/50">
            <TabsTrigger value="day">Día</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="year">Año</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* DÍA */}
      {tempFilters.timeMode === "day" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase text-muted-foreground">Rango de fechas</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="font-normal border-dashed" variant="outline">
                {tempFilters.dateRange?.from && tempFilters.dateRange?.to
                  ? `${format(tempFilters.dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(tempFilters.dateRange.to, "dd/MM/yyyy", { locale: es })}`
                  : "Seleccionar rango"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={tempFilters.dateRange}
                onSelect={(range) => setTempFilters({ dateRange: range })}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* MES */}
      {tempFilters.timeMode === "month" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase text-muted-foreground">Mes</span>
          <Select 
            value={tempFilters.dateRange?.from ? String(tempFilters.dateRange.from.getMonth()) : ""}
            onValueChange={(v) => {
              const now = new Date();
              const from = new Date(now.getFullYear(), parseInt(v), 1);
              const to = new Date(now.getFullYear(), parseInt(v) + 1, 0);
              setTempFilters({ dateRange: { from, to } });
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar mes" />
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
      {tempFilters.timeMode === "year" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase text-muted-foreground">Año</span>
          <Select
             value={tempFilters.dateRange?.from ? String(tempFilters.dateRange.from.getFullYear()) : ""}
             onValueChange={(v) => {
               const from = new Date(parseInt(v), 0, 1);
               const to = new Date(parseInt(v), 11, 31);
               setTempFilters({ dateRange: { from, to } });
             }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* CATEGORÍA */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase text-muted-foreground">Categoría</span>
        <Select 
          value={tempFilters.categoryId || "all"} 
          onValueChange={(v) => {
            setTempFilters({ categoryId: v, productId: null }); // Clear product when category changes
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {flatCats.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {getCategoryLabel(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* PRODUCTO */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase text-muted-foreground">Producto</span>
        <Popover open={productOpen} onOpenChange={setProductOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[200px] font-normal justify-start truncate"
            >
              {tempFilters.productId ? (
                products.find((p) => p.id === tempFilters.productId)?.name
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar producto...
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Filtrar por nombre..." />
              <CommandList>
                <CommandItem
                  onSelect={() => {
                    setTempFilters({ productId: null });
                    setProductOpen(false);
                  }}
                >
                  Todos los productos
                </CommandItem>
                {filteredProducts.map((p) => (
                  <CommandItem
                    key={p.id}
                    onSelect={() => {
                      setTempFilters({ productId: p.id });
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

      <div className="flex items-end h-full pt-6">
        <Button 
          onClick={handleApply}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-95"
        >
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}

// src/components/home/product-filters.tsx
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { CleanIcon, ToolsIcon } from "@hugeicons/core-free-icons";

export function ProductFilters({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  showReserved,
  setShowReserved,
  viewMode, // Agregamos esto
  setViewMode,
}: any) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between  gap-4">
        <div className="flex items-center space-x-4">
          {" "}
          {/* Ajusté el space-x-9 a 4 para que quepan los nuevos botones */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger value="todos">Ambos</TabsTrigger>
              <TabsTrigger value="alquiler">Alquiler</TabsTrigger>
              <TabsTrigger value="venta">Venta</TabsTrigger>
            </TabsList>
          </Tabs>
          {/* Switch de Reservados */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-muted rounded-lg border border-transparent has-checked:border-blue-500/30 transition-all">
            <Label
              htmlFor="reserved-mode"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Reservas
            </Label>
            <Switch
              id="reserved-mode"
              checked={viewMode === "reserved"}
              onCheckedChange={(checked) =>
                setViewMode(checked ? "reserved" : "catalog")
              }
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              setViewMode(viewMode === "laundry" ? "catalog" : "laundry")
            }
            className={`p-2 rounded-lg border transition-all ${
              viewMode === "laundry"
                ? "bg-blue-600/30  border-blue-600/30"
                : "bg-card text-slate-400 "
            }`}
            title="Lavandería"
          >
            <HugeiconsIcon icon={CleanIcon} size={18} />
          </button>
          <button
            onClick={() =>
              setViewMode(
                viewMode === "maintenance" ? "catalog" : "maintenance"
              )
            }
            className={`p-2 rounded-lg border transition-all ${
              viewMode === "maintenance"
                ? "bg-amber-500/30 border-amber-500/30"
                : "bg-card text-slate-400 "
            }`}
            title="Mantenimiento"
          >
            <HugeiconsIcon icon={ToolsIcon} size={18} />
          </button>
        </div>
        {showReserved && searchQuery && (
          <p className="text-[10px] text-muted-foreground italic px-1">
            Buscando coincidencias en productos y clientes...
          </p>
        )}

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4" />
          <Input
            // Lógica de placeholder según el modo
            placeholder={
              showReserved
                ? "Producto, cliente o DNI..."
                : "Buscar productos..."
            }
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

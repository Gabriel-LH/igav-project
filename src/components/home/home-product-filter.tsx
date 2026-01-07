// src/components/home/product-filters.tsx
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch"; // Asegúrate de tenerlo instalado
import { Label } from "@/components/ui/label";

export function ProductFilters({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  showReserved, // Nuevo prop
  setShowReserved, // Nuevo prop
}: any) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-9">
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

          {/* Sección del Switch de Reservados */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-muted  rounded-lg">
            <Label htmlFor="reserved-mode" className="text-xs font-medium">
              Ver reservados
            </Label>
            <Switch
              id="reserved-mode"
              checked={showReserved}
              onCheckedChange={setShowReserved}
            />
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4" />
          <Input
            placeholder="Buscar productos..."
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

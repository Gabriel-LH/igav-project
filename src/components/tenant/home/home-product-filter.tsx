// src/components/home/product-filters.tsx
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Icon, Search, WashingMachine, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { ToolsIcon, WashingMachineIcon } from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { iron } from "@lucide/lab";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: string;
  isCollectorMode?: boolean;
  setIsCollectorMode?: (val: boolean) => void;
  onCameraClick?: () => void;
}

export function ProductFilters({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  isCollectorMode = false,
  setIsCollectorMode = () => {},
  onCameraClick = () => {},
}: Props) {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile ? (
        <>
          <div className="flex flex-col mb-6 ">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="todos" className="flex-1">Ambos</TabsTrigger>
                    <TabsTrigger value="alquiler" className="flex-1">Alquiler</TabsTrigger>
                    <TabsTrigger value="venta" className="flex-1">Venta</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex flex-col gap-2 w-full">
                  {/* Fila 1: Reservas + Herramientas */}
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 flex items-center justify-between px-3 py-2 bg-muted rounded-lg border border-transparent has-checked:border-blue-500/30 transition-all">
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
                    
                    <div className="flex gap-1.5">
                      <button
                        onClick={() =>
                          setViewMode(viewMode === "laundry" ? "catalog" : "laundry")
                        }
                        className={`p-2.5 rounded-lg border transition-all ${
                          viewMode === "laundry"
                            ? "bg-blue-600/30 border-blue-600/30 text-blue-700"
                            : "bg-muted text-muted-foreground border-transparent"
                        }`}
                        title="Lavandería"
                      >
                        <HugeiconsIcon
                          icon={WashingMachineIcon}
                          size={18}
                          strokeWidth={2}
                        />
                      </button>

                      <button
                        onClick={() =>
                          setViewMode(
                            viewMode === "maintenance" ? "catalog" : "maintenance",
                          )
                        }
                        className={`p-2.5 rounded-lg border transition-all ${
                          viewMode === "maintenance"
                            ? "bg-amber-500/30 border-amber-500/30 text-amber-700"
                            : "bg-muted text-muted-foreground border-transparent"
                        }`}
                        title="Mantenimiento"
                      >
                        <HugeiconsIcon icon={ToolsIcon} size={18} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Fila 2: Modo Recolector + Scanner */}
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 flex items-center justify-between px-3 py-2 bg-muted rounded-lg border border-transparent has-checked:border-primary/30 transition-all">
                      <Label
                        htmlFor="collector-mode"
                        className="text-[10px] font-bold uppercase text-muted-foreground"
                      >
                        Modo Recolector
                      </Label>
                      <Switch
                        id="collector-mode"
                        checked={isCollectorMode}
                        onCheckedChange={setIsCollectorMode}
                      />
                    </div>

                    {/* Botón de Cámara (Móvil) */}
                    <button
                      onClick={onCameraClick}
                      className="p-2.5 rounded-lg border bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95 shrink-0"
                      title="Escanear con Cámara"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {viewMode === "reserved" && searchQuery && (
            <p className="text-[10px] text-muted-foreground italic px-1">
              Buscando coincidencias en productos y clientes...
            </p>
          )}

          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                placeholder={
                  viewMode === "reserved"
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
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4 mb-6 ">
            <div className="flex flex-row justify-between gap-4">
              <div className="flex items-center space-x-4 ">
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
                {/* Switch de Modo Recolector (Escritorio) */}
                <div className="flex items-center space-x-2 px-3 py-2 bg-muted rounded-lg border border-transparent has-checked:border-primary/30 transition-all">
                  <Label
                    htmlFor="collector-mode-desktop"
                    className="text-[10px] font-bold uppercase text-muted-foreground"
                  >
                    Modo Recolector
                  </Label>
                  <Switch
                    id="collector-mode-desktop"
                    checked={isCollectorMode}
                    onCheckedChange={setIsCollectorMode}
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() =>
                      setViewMode(
                        viewMode === "laundry" ? "catalog" : "laundry"
                      )
                    }
                    className={`p-2 rounded-lg border transition-all ${
                      viewMode === "laundry"
                        ? "bg-blue-600/30  border-blue-600/30"
                        : "bg-card text-slate-400 "
                    }`}
                    title="Lavandería"
                  >
                    <WashingMachine size={18} strokeWidth={2} />
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
                    <Icon iconNode={iron} size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {viewMode === "reserved" && searchQuery && (
                <p className="text-[10px] text-muted-foreground italic px-1">
                  Buscando coincidencias en productos y clientes...
                </p>
              )}

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4" />
                <Input
                  // Lógica de placeholder según el modo
                  placeholder={
                    viewMode === "reserved"
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
                
                {/* Botón de Cámara (Escritorio) */}
                <button
                  onClick={onCameraClick}
                  className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all active:scale-95 flex items-center gap-2 font-bold text-xs"
                  title="Escanear con Cámara"
                >
                  <Camera className="h-4 w-4" />
                  Scanner
                </button>
              </div>
            </div>
        </>
      )}
    </>
  );
}

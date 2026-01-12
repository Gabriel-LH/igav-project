// src/components/home/details-product-viewer.tsx
import React, { useMemo, useState } from "react";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer";
import { Separator } from "@/components/separator";
import { Badge } from "@/components/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CalendarLock01Icon,
  SaleTag02Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { z } from "zod";
import { productSchema } from "../../types/product/type.product";
import { Label } from "@/components/label";
import { CardContent, Card } from "@/components/card";
import { cn } from "@/lib/utils";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { STOCK_MOCK } from "@/src/mocks/mock.stock";
import { BRANCH_MOCKS } from "@/src/mocks/mock.branch";
import { formatCurrency } from "@/src/utils/currency-format";

export function DetailsProductViewer({
  item,
}: {
  item: z.infer<typeof productSchema>;
}) {
  const isMobile = useIsMobile();
  const user = USER_MOCK;
  const currentBranchId = user[0].branchId;

  // --- NUEVA LÓGICA DE DATOS (STOCK_MOCK es la fuente de verdad) ---

  // 1. OBTENER TODAS LAS VARIANTES DE ESTE PRODUCTO
  const allProductStock = useMemo(
    () =>
      STOCK_MOCK.filter((s) => s.productId.toString() === item.id.toString()),
    [item.id]
  );

  // 2. TALLAS ÚNICAS DISPONIBLES
  const availableSizes = useMemo(
    () => Array.from(new Set(allProductStock.map((s) => s.size))),
    [allProductStock]
  );

  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || null);

  // 3. COLORES DISPONIBLES PARA LA TALLA SELECCIONADA
  const colorsForSelectedSize = useMemo(() => {
    const stockInSize = allProductStock.filter((s) => s.size === selectedSize);
    // Agrupamos para tener colores únicos con sus hex
    return Array.from(
      new Map(
        stockInSize.map((s) => [s.color, { name: s.color, hex: s.colorHex }])
      ).values()
    );
  }, [selectedSize, allProductStock]);

  const [selectedColor, setSelectedColor] = useState(
    colorsForSelectedSize[0] || null
  );

  // 4. AUTO-CORRECCIÓN DE COLOR AL CAMBIAR TALLA
  React.useEffect(() => {
    const isColorAvailable = colorsForSelectedSize.some(
      (c) => c.name === selectedColor?.name
    );
    if (!isColorAvailable && colorsForSelectedSize.length > 0) {
      setSelectedColor(colorsForSelectedSize[0]);
    }
  }, [selectedSize, colorsForSelectedSize]);

  // 5. CÁLCULO DE STOCK (Local vs Global)
  // Filtramos el stock específico de la combinación Talla + Color
  const variantLocations = allProductStock.filter(
    (s) => s.size === selectedSize && s.color === selectedColor?.name
  );

  const localStock =
    variantLocations.find((l) => l.branchId === currentBranchId)?.quantity || 0;
  const totalStockCombo = variantLocations.reduce(
    (acc, curr) => acc + curr.quantity,
    0
  );
  const otherBranchStock = totalStockCombo - localStock;

  // Para el Badge del Header (Stock total de todas las tallas/colores)
  const totalGlobalStock = allProductStock.reduce(
    (acc, curr) => acc + curr.quantity,
    0
  );

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full">
          Ver detalles
        </Button>
      </DrawerTrigger>

      <DrawerContent className={isMobile ? "" : "max-w-md ml-auto h-full"}>
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-2xl">{item.name}</DrawerTitle>
          <div className="flex gap-2 mt-2">
            <Badge
              variant="outline"
              className="font-mono text-blue-600 border-blue-200"
            >
              SKU: {item.sku}
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 border-none">
              Existencia Total: {totalGlobalStock}
            </Badge>
          </div>
        </DrawerHeader>

        <div className="flex flex-col gap-6 p-6 overflow-y-auto">
          {/* PASO 1: SELECCIÓN DE TALLA */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">
              1. Seleccionar Talla
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? "default" : "outline"}
                  className={cn(
                    "h-12 w-14 font-bold",
                    selectedSize === size && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* PASO 2: SELECCIÓN DE COLOR */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">
              2. Color en Talla {selectedSize}
            </Label>
            <div className="flex flex-wrap gap-4">
              {colorsForSelectedSize.map((color) => {
                const isSelected = selectedColor?.name === color.name;

                // CAMBIO: Buscamos el stock total de este color específico en la talla seleccionada
                // usando nuestro array plano de stock
                const totalStockThisColor = allProductStock
                  .filter(
                    (s) => s.size === selectedSize && s.color === color.name
                  )
                  .reduce((acc, curr) => acc + curr.quantity, 0);

                const hasGlobalStock = totalStockThisColor > 0;

                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "group relative flex flex-col items-center gap-1 transition-all",
                      !hasGlobalStock && "opacity-40"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "border-primary scale-110 shadow-lg"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && (
                        <HugeiconsIcon
                          icon={Tick01Icon}
                          className="w-6 h-6 text-white mix-blend-difference"
                        />
                      )}
                      {!hasGlobalStock && (
                        <div className="absolute inset-0 border-t-2 border-destructive rotate-45 top-1/2 w-full" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] uppercase",
                        isSelected
                          ? "font-bold text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PANEL DE DISPONIBILIDAD */}
          <div className="grid grid-cols-1 gap-4">
            <div className="border rounded-lg bg-card border-emerald-100">
              <div className="flex flex-col justify-between items-center">
                <div className="flex w-full bg-muted justify-between rounded-t-lg border-b pb-1">
                  <div className="flex w-full justify-between px-2 py-1">
                    <p className="text-[10px] font-bold uppercase text-emerald-700">
                      Stock en esta Sede
                    </p>
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Otras Sedes
                    </p>
                  </div>
                </div>
                <div className="flex w-full justify-between">
                  <div className="flex w-full justify-between px-2 py-1">
                    <p
                      className={cn(
                        "text-2xl font-black",
                        localStock > 0 ? "text-emerald-600" : "text-slate-400"
                      )}
                    >
                      {localStock}{" "}
                      <span className="text-xs font-medium">unid.</span>
                    </p>
                    <p className="text-xl font-bold text-slate-700">
                      +{otherBranchStock}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TABLA DE SEDES DETALLADA */}
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="bg-muted p-2 text-[10px] font-bold uppercase">
                Distribución por Sucursal
              </div>
              {/* CAMBIO: Ahora mapeamos 'variantLocations' que ya tiene el filtro de Talla + Color */}
              {variantLocations.map((loc) => {
                const branchName =
                  BRANCH_MOCKS.find((b) => b.id === loc.branchId)?.name ||
                  "Sucursal";
                return (
                  <div
                    key={loc.branchId}
                    className="flex justify-between p-3 border-t text-sm"
                  >
                    <span
                      className={cn(
                        loc.branchId === currentBranchId &&
                          "font-bold text-blue-600"
                      )}
                    >
                      {branchName}{" "}
                      {loc.branchId === currentBranchId && "(Aquí)"}
                    </span>
                    <span className="font-mono font-bold">{loc.quantity}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* PRECIOS Y CONDICIÓN */}

          <div className="rounded-lg p-2 border bg-card">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Precio alquiler
                  </p>
                  <div className="flex items-center gap-1">
                    <p className="text-md font-bold">
                      {formatCurrency(item.price_rent || 0)}
                    </p>
                    <p className="text-xs font-bold">por {item.rent_unit}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Precio venta
                  </p>

                  <p className="text-md font-bold">
                    {formatCurrency(item.price_sell || 0)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className=" grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Condición
                  </p>

                  <p className="text-sm font-bold text-foreground">
                    {allProductStock[0].condition}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Estado
                  </p>

                  <p className="text-sm capitalize font-bold text-foreground">
                    {allProductStock[0].status}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* DESCRIPCIÓN */}

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase text-muted-foreground">
              Descripción del artículo:
            </h4>

            <p className="text-muted-foreground leading-relaxed italic border-l-2 pl-3">
              "{item.description}"
            </p>
          </div>
        </div>

        <DrawerFooter className="border-t bg-muted/30">
          <div className="grid grid-cols-2 gap-2 w-full">
            {/* BOTÓN ALQUILAR: Solo si hay stock Y el producto permite alquiler */}
            <Button
              disabled={totalStockCombo === 0 || !item.can_rent}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white"
            >
              <HugeiconsIcon
                icon={Calendar03Icon}
                strokeWidth={2.2}
                className="w-4 h-4 mr-2"
              />
              Alquilar
            </Button>

            {/* BOTÓN VENDER: Solo si hay stock Y el producto permite venta */}
            <Button
              disabled={totalStockCombo === 0 || !item.can_sell}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white"
            >
              <HugeiconsIcon
                icon={SaleTag02Icon}
                strokeWidth={2.2}
                className="w-4 h-4 mr-2"
              />
              Vender
            </Button>

            {/* RESERVAR FECHA: Muy usado en ropa de gala/eventos */}
            <Button
              disabled={totalStockCombo === 0}
              className="col-span-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
            >
              <HugeiconsIcon
                icon={CalendarLock01Icon}
                strokeWidth={2.2}
                className="w-4 h-4 mr-2"
              />
              Reservar Fecha
            </Button>

            <DrawerClose asChild>
              <Button variant="ghost" className="col-span-2">
                Regresar al catálogo
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// src/components/home/details-product-viewer.tsx
import React, { useState } from "react";
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
import { productSchema } from "./type.product";
import { Label } from "@/components/label";
import { CardContent, Card } from "@/components/card";
import { cn } from "@/lib/utils";

export function DetailsProductViewer({
  item,
}: {
  item: z.infer<typeof productSchema>;
}) {
  const isMobile = useIsMobile();

  // 1. Estados principales
  const [selectedSize, setSelectedSize] = useState(item.sizes?.[0] || null);

  // 2. Colores que tienen stock (en cualquier tienda) para la talla elegida
  const availableColorsForSize = item.inventory
    .filter(
      (inv) =>
        inv.size === selectedSize &&
        (inv.stock > 0 || inv.other_branch_stock > 0)
    )
    .map((inv) => inv.color);

  const [selectedColor, setSelectedColor] = useState(item.colors[0]);

  // 3. Auto-corrección de color al cambiar talla
  React.useEffect(() => {
    if (!availableColorsForSize.includes(selectedColor?.name)) {
      const nextAvailable = item.colors.find((c) =>
        availableColorsForSize.includes(c.name)
      );
      if (nextAvailable) setSelectedColor(nextAvailable);
    }
  }, [selectedSize]);

  // 4. Datos de stock de la combinación exacta
  const currentInv = item.inventory.find(
    (inv) => inv.color === selectedColor?.name && inv.size === selectedSize
  );

  const localStock = currentInv?.stock || 0;
  const otherBranchStock = currentInv?.other_branch_stock || 0;
  const totalStockCombo = localStock + otherBranchStock;

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full">
          Ver detalles
        </Button>
      </DrawerTrigger>

      <DrawerContent className={isMobile ? "" : "max-w-md ml-auto h-full"}>
        <DrawerHeader className="border-b">
          <DrawerTitle>{item.name}</DrawerTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="font-mono">
              {item.sku}
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
              Stock Global: {item.total_stock}
            </Badge>
          </div>
        </DrawerHeader>

        <div className="flex flex-col gap-6 p-6 overflow-y-auto">
          {/* 1. SELECCIÓN DE TALLA */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              Paso 1: Seleccionar Talla
            </Label>
            <div className="flex flex-wrap gap-2">
              {item.sizes.map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? "default" : "outline"}
                  className="h-12 w-14 font-bold relative"
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* 2. SELECCIÓN DE COLOR */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              Paso 2: Color en Talla {selectedSize}
            </Label>
            <div className="flex gap-4">
              {item.colors.map((color) => {
                // Calculamos disponibilidad para este color específico en la talla seleccionada
                const invForThisColor = item.inventory.find(
                  (inv) => inv.color === color.name && inv.size === selectedSize
                );

                const hasLocal = (invForThisColor?.stock || 0) > 0;
                const hasOther = (invForThisColor?.other_branch_stock || 0) > 0;
                const isAvailableGlobal = hasLocal || hasOther;

                return (
                  <div
                    key={color.name}
                    className="flex flex-col items-center gap-1"
                  >
                    <button
                      type="button"
                      // IMPORTANTE: Ya no usamos 'disabled', ahora siempre es cliqueable
                      onClick={() => setSelectedColor(color)}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                        selectedColor?.name === color.name
                          ? "border-primary ring-4 ring-primary/20 scale-110 z-10"
                          : "border-transparent"
                      } ${!isAvailableGlobal ? "opacity-20 grayscale" : ""}`} // Solo opaco si NO HAY NADA en ninguna parte
                      style={{ backgroundColor: color.hex }}
                    >
                      {/* Si no hay stock LOCAL, pero sí hay en OTRA sucursal, ponemos un aviso visual sutil */}
                      {!hasLocal && hasOther && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        </div>
                      )}

                      {/* Marcador de seleccionado */}
                      {selectedColor?.name === color.name && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <HugeiconsIcon
                            icon={Tick01Icon}
                            className="w-6 h-6 text-white mix-blend-difference"
                          />
                        </div>
                      )}

                      {/* Tachado: SOLO si está agotado en TODAS las tiendas */}
                      {!isAvailableGlobal && (
                        <div className="absolute inset-0 border-t-2 border-red-500 rotate-45 top-1/2 w-full" />
                      )}
                    </button>
                    <span
                      className={`text-[9px] font-medium uppercase ${
                        selectedColor?.name === color.name
                          ? "text-primary font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {color.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL DE DISPONIBILIDAD Y PRECIOS */}
          <div className="pt-4 space-y-4">
            <Card className="rounded-xl">
              <CardContent className="space-y-3">
                {/* STOCK */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Stock en esta tienda
                    </p>
                    <p
                      className={cn(
                        "text-xl font-bold",
                        localStock > 0 ? "text-emerald-100" : "text-orange-600"
                      )}
                    >
                      {localStock > 0 ? localStock > 1 ? `${localStock} unidades` : " unidad" : "Agotado"}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Otras sucursales
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {otherBranchStock > 0 ? `+${otherBranchStock}` : "0"}
                    </p>
                  </div>
                </div>

                {/* AVISO DE OTRA SUCURSAL */}
                {localStock === 0 && otherBranchStock > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2 text-orange-700 text-xs">
                    <HugeiconsIcon
                      icon={Tick01Icon}
                      className="w-4 h-4 mt-0.5 text-orange-600"
                    />
                    <span>
                      Hay existencias en otra sucursal. Puedes solicitar un
                      traslado.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PRECIOS Y CONDICIÓN */}
            <Card className="rounded-xl">
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Precio alquiler
                    </p>
                    <p className="text-md font-bold">
                      ${item.price_rent} por {item.rent_unit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Precio venta
                    </p>
                    <p className="text-md font-bold">
                      ${item.price_sell}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Condición
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {item.condition}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Estado
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {item.status.toUpperCase()}
                  </p>
                </div>
                </div>
              </CardContent>
            </Card>
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

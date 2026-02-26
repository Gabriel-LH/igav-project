// src/components/home/details-product-viewer.tsx
import React, { useMemo, useState } from "react";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
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
import { cn } from "@/lib/utils";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { BRANCH_MOCKS } from "@/src/mocks/mock.branch";
import { formatCurrency } from "@/src/utils/currency-format";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { ReservationModal } from "./ui/reservation/ReservationModal";
import { DirectTransactionModal } from "./ui/direct-transaction/DirectTransactionModal";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useAttributeStore } from "@/src/store/useAttributeStore";

export function DetailsProductViewer({
  item,
}: {
  item: z.infer<typeof productSchema>;
}) {
  const isMobile = useIsMobile();
  const user = USER_MOCK;
  const currentBranchId = user[0].branchId!;
  const { getSizeById, getColorById, getModelById, getCategoryById } =
    useAttributeStore();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const { inventoryItems, stockLots } = useInventoryStore();

  // 1. OBTENER TODAS LAS VARIANTES DE ESTE PRODUCTO (Global)
  const allProductStock = useMemo(() => {
    const productId = String(item.id);
    const serials = inventoryItems.filter(
      (s) => String(s.productId) === productId && s.status === "disponible",
    );
    const lots = stockLots.filter(
      (s) =>
        String(s.productId) === productId &&
        s.status === "disponible" &&
        s.quantity > 0,
    );
    return [...serials, ...lots];
  }, [item.id, inventoryItems, stockLots]);

  // 2. TALLAS ÚNICAS DISPONIBLES
  const availableSizes = useMemo(
    () => Array.from(new Set(allProductStock.map((s) => s.sizeId))),
    [allProductStock],
  );

  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || null);

  // 3. COLORES DISPONIBLES PARA LA TALLA SELECCIONADA
  const colorsForSelectedSize = useMemo(() => {
    const stockInSize = allProductStock.filter(
      (s) => s.sizeId === selectedSize,
    );
    return Array.from(
      new Map(
        stockInSize.map((s) => {
          const color = getColorById(s.colorId);
          return [
            s.colorId,
            {
              id: s.colorId,
              name: color?.name || "Desconocido",
              hex: color?.hex || "#CCCCCC",
            },
          ];
        }),
      ).values(),
    );
  }, [selectedSize, allProductStock, getColorById]);

  const [selectedColor, setSelectedColor] = useState(
    colorsForSelectedSize[0] || null,
  );

  // Sync selected color if size changes
  React.useEffect(() => {
    if (
      colorsForSelectedSize.length > 0 &&
      (!selectedColor ||
        !colorsForSelectedSize.find((c) => c.id === selectedColor.id))
    ) {
      setSelectedColor(colorsForSelectedSize[0]);
    }
  }, [colorsForSelectedSize, selectedColor]);

  // 5. CÁLCULO DE STOCK (Local vs Global)
  const variantLocations = useMemo(
    () =>
      allProductStock.filter(
        (s) => s.sizeId === selectedSize && s.colorId === selectedColor?.id,
      ),
    [allProductStock, selectedSize, selectedColor],
  );

  const localStock = useMemo(
    () =>
      variantLocations
        .filter((l) => l.branchId === currentBranchId)
        .reduce((acc, curr: any) => acc + (curr.quantity ?? 1), 0),
    [variantLocations, currentBranchId],
  );

  const totalStockCombo = useMemo(
    () =>
      variantLocations.reduce(
        (acc, curr: any) => acc + (curr.quantity ?? 1),
        0,
      ),
    [variantLocations],
  );

  const stockSellQty = useMemo(
    () =>
      variantLocations
        .filter((l) => l.branchId === currentBranchId && l.isForSale)
        .reduce((acc, curr: any) => acc + (curr.quantity ?? 1), 0),
    [variantLocations, currentBranchId],
  );

  const stockRentQty = useMemo(
    () =>
      variantLocations
        .filter((l) => l.branchId === currentBranchId && l.isForRent)
        .reduce((acc, curr: any) => acc + (curr.quantity ?? 1), 0),
    [variantLocations, currentBranchId],
  );

  const canReserveCurrentSelection = useMemo(() => {
    if (!selectedSize || !selectedColor) return false;
    return variantLocations.some((s) => s.isForRent || s.isForSale);
  }, [variantLocations, selectedSize, selectedColor]);

  const maxTransferTime = useMemo(() => {
    const externalBranches = variantLocations.filter(
      (s) => s.branchId !== currentBranchId,
    );
    if (externalBranches.length === 0) return 0;
    return Math.max(
      ...externalBranches.map((s) =>
        getEstimatedTransferTime(
          s.branchId,
          currentBranchId!,
          BUSINESS_RULES_MOCK,
        ),
      ),
    );
  }, [variantLocations, currentBranchId]);

  const otherBranchStock = totalStockCombo - localStock;

  const totalGlobalStock = useMemo(
    () =>
      allProductStock.reduce((acc, curr: any) => acc + (curr.quantity ?? 1), 0),
    [allProductStock],
  );

  return (
    <Drawer
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerTrigger asChild>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setDrawerOpen(true)}
        >
          Ver detalles
        </Button>
      </DrawerTrigger>

      <DrawerContent
        aria-hidden="false"
        className={isMobile ? "" : "max-w-md ml-auto h-full"}
      >
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-2xl">{item.name}</DrawerTitle>
          <DrawerDescription className="flex gap-2">
            <Badge
              variant="outline"
              className="font-mono text-blue-600 border-blue-500"
            >
              SKU: {item.sku}
            </Badge>
            <Badge className="bg-muted text-primary border-gray-500">
              Existencia Total: {totalGlobalStock}
            </Badge>
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex px-4 py-2">
          {item.categoryId
            ? getCategoryById(item.categoryId)?.name || "General"
            : "General"}
          {item.modelId && (
            <span className="ml-2 text-slate-400 font-bold italic">
              - {getModelById(item.modelId)?.name || item.modelId}
            </span>
          )}
        </div>
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
                    "h-12 w-14 rounded-2xl font-bold",
                    selectedSize === size && "ring-primary ring-offset-2",
                  )}
                  onClick={() => setSelectedSize(size)}
                >
                  {getSizeById(size)?.name || size}
                </Button>
              ))}
            </div>
          </div>

          {/* PASO 2: SELECCIÓN DE COLOR */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">
              2. Color en Talla{" "}
              {getSizeById(selectedSize!)?.name || selectedSize}
            </Label>
            <div className="flex flex-wrap gap-4">
              {colorsForSelectedSize.map((color) => {
                const isSelected = selectedColor?.id === color.id;
                const totalStockThisColor = allProductStock
                  .filter(
                    (s) => s.sizeId === selectedSize && s.colorId === color.id,
                  )
                  .reduce((acc, curr: any) => acc + (curr.quantity ?? 1), 0);

                const hasGlobalStock = totalStockThisColor > 0;

                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "group relative flex flex-col items-center gap-1 transition-all",
                      !hasGlobalStock && "opacity-40",
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full border flex items-center justify-center transition-all",
                        isSelected
                          ? "border-primary scale-110 shadow-lg"
                          : "border-gray-800",
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
                          : "text-muted-foreground",
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
            <div className="border rounded-lg bg-card border-gray-800">
              <div className="flex flex-col justify-between items-center">
                <div className="flex w-full bg-muted justify-between rounded-t-lg border-b p-2">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">
                    Stock en esta Sede
                  </p>
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Otras Sedes
                  </p>
                </div>
                <div className="flex w-full justify-between p-3">
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-2xl font-black",
                        localStock > 0 ? "text-emerald-500" : "text-slate-400",
                      )}
                    >
                      {localStock}{" "}
                      <span className="text-xs font-medium">unid.</span>
                    </span>
                    <div className="flex gap-2">
                      {stockSellQty > 0 && (
                        <span className="text-[10px]">
                          <span className="text-emerald-500 font-bold">
                            Venta:
                          </span>{" "}
                          {stockSellQty}
                        </span>
                      )}
                      {stockRentQty > 0 && (
                        <span className="text-[10px]">
                          <span className="text-emerald-500 font-bold">
                            Alq:
                          </span>{" "}
                          {stockRentQty}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xl font-bold text-violet-700">
                    +{otherBranchStock}
                  </span>
                </div>
              </div>
            </div>

            {/* TABLA DE SEDES DETALLADA */}
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="bg-muted p-2 text-[10px] font-bold uppercase">
                Distribución por Sucursal
              </div>

              {Array.from(
                variantLocations.reduce((acc, curr: any) => {
                  const branchId = curr.branchId;
                  const currentQty = acc.get(branchId) || 0;
                  acc.set(branchId, currentQty + (curr.quantity ?? 1));
                  return acc;
                }, new Map<string, number>()),
              ).map(([branchId, quantity]) => {
                const branch = BRANCH_MOCKS.find((b) => b.id === branchId);
                const branchName = branch?.name || "Sucursal";
                const isLocal = branchId === currentBranchId;
                const transferTime = !isLocal
                  ? getEstimatedTransferTime(
                      branchId,
                      currentBranchId!,
                      BUSINESS_RULES_MOCK,
                    )
                  : 0;

                return (
                  <div
                    key={branchId}
                    className={cn("flex flex-col border-t p-3 text-sm")}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={cn(
                          "flex items-center gap-1",
                          isLocal && "font-bold text-emerald-600",
                        )}
                      >
                        {isLocal ? (
                          <HugeiconsIcon
                            icon={Tick01Icon}
                            className="w-3 h-3 text-emerald-500"
                          />
                        ) : (
                          <div className="w-3" />
                        )}
                        {branchName} {isLocal && "(Aquí)"}
                      </span>
                      <span className="font-mono font-bold">
                        {quantity} unid.
                      </span>
                    </div>
                    {!isLocal && quantity > 0 && (
                      <p className="text-[10px] text-blue-500 font-medium mt-1 flex items-center gap-1">
                        <HugeiconsIcon
                          icon={Calendar03Icon}
                          className="w-3 h-3"
                        />
                        Traslado estimado: {transferTime}{" "}
                        {transferTime === 1 ? "día hábil" : "días hábiles"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PRECIOS Y CONDICIÓN */}
          <div className="rounded-lg p-3 border bg-card space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">
                  Precio alquiler
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-bold">
                    {formatCurrency(item.price_rent || 0)}
                  </p>
                  <p className="text-[10px] font-bold">/ {item.rent_unit}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">
                  Precio venta
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(item.price_sell || 0)}
                </p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">
                  Condición
                </p>
                <p className="text-sm font-bold capitalize">
                  {(variantLocations[0] as any)?.condition || "Excelente"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">
                  Estado
                </p>
                <p className="text-sm font-bold capitalize">
                  {variantLocations[0]?.status || "Disponible"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-[10px] uppercase text-muted-foreground">
              Descripción del artículo:
            </h4>
            <p className="text-muted-foreground leading-relaxed italic border-l-2 pl-3">
              &quot;{item.description}&quot;
            </p>
          </div>
        </div>

        <DrawerFooter className="border-t bg-muted/30">
          <div className="flex flex-col gap-2 w-full">
            <div className="grid grid-cols-2 gap-2 w-full">
              <DirectTransactionModal
                item={item}
                sizeId={selectedSize || ""}
                colorId={selectedColor?.id || ""}
                type="alquiler"
                currentBranchId={currentBranchId}
                onSuccess={() => setDrawerOpen(false)}
              >
                <Button
                  disabled={stockRentQty === 0}
                  className="bg-blue-600 text-white hover:bg-blue-700 font-bold"
                >
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    className="w-4 h-4 mr-2"
                  />
                  Alquilar
                </Button>
              </DirectTransactionModal>

              <DirectTransactionModal
                item={item}
                sizeId={selectedSize || ""}
                colorId={selectedColor?.id || ""}
                type="venta"
                currentBranchId={currentBranchId}
                onSuccess={() => setDrawerOpen(false)}
              >
                <Button
                  disabled={stockSellQty === 0}
                  className="bg-orange-600 text-white hover:bg-orange-700 font-bold"
                >
                  <HugeiconsIcon
                    icon={SaleTag02Icon}
                    className="w-4 h-4 mr-2"
                  />
                  Vender
                </Button>
              </DirectTransactionModal>

              <ReservationModal
                item={item}
                sizeId={selectedSize || ""}
                colorId={selectedColor?.id || ""}
                currentBranchId={currentBranchId}
                originBranchId={
                  variantLocations.find((v) => v.branchId !== currentBranchId)
                    ?.branchId || currentBranchId!
                }
                onSuccess={() => setDrawerOpen(false)}
              >
                <Button
                  disabled={!canReserveCurrentSelection}
                  className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <HugeiconsIcon
                    icon={CalendarLock01Icon}
                    className="w-4 h-4 mr-2"
                  />
                  {localStock > 0
                    ? "Realizar una reserva"
                    : `Solicitar traslado y reservar (${maxTransferTime} días)`}
                </Button>
              </ReservationModal>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

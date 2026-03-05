"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  CalendarClock,
  Package2,
  ShoppingCart,
  MapPin,
  Truck,
  Box,
  Tag,
  Layers,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useAttributeStore } from "@/src/store/useAttributeStore";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { MOCK_BRANCHES } from "@/src/mocks/mock.branch";
import { formatCurrency } from "@/src/utils/currency-format";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { DirectTransactionModal } from "./ui/direct-transaction/DirectTransactionModal";
import { ReservationModal } from "./ui/reservation/ReservationModal";
import { FeatureGuard } from "@/src/components/tenant/guards/FeatureGuard";
import { resolveProductLookup } from "@/src/utils/product/resolveProductLookup";
import { cn } from "@/lib/utils";
import { usePromotionStore } from "@/src/store/usePromotionStore";
import { calculateBestPromotionForProduct } from "@/src/utils/promotion/promotio.engine";
import { PromotionLoaderService } from "@/src/domain/services/promotionLoader.service";
import { ZustandPromotionRepository } from "@/src/infrastructure/stores-adapters/ZustandPromotionRepository";

interface ProductDetailsPageProps {
  lookup: string;
  initialVariantId?: string;
}

interface VariantChoice {
  id: string;
  label: string;
  colorName: string;
  colorHex?: string;
  sizeLabel: string;
  priceRent?: number;
  priceSell?: number;
  rentUnit?: string;
}

export function ProductDetailsPage({
  lookup,
  initialVariantId,
}: ProductDetailsPageProps) {
  const router = useRouter();
  const { products, productVariants, inventoryItems, stockLots } =
    useInventoryStore();
  const { getCategoryById, getModelById, getColorById, getSizeById, colors } =
    useAttributeStore();
  const { promotions } = usePromotionStore();
  const currentBranchId = USER_MOCK[0].branchId!;

  useEffect(() => {
    const promotionRepo = new ZustandPromotionRepository();
    const promotionLoader = new PromotionLoaderService(promotionRepo);
    promotionLoader.ensurePromotionsLoaded();
  }, []);

  const resolution = useMemo(
    () =>
      resolveProductLookup({
        products,
        productVariants,
        inventoryItems,
        stockLots,
        lookup,
      }),
    [inventoryItems, lookup, productVariants, products, stockLots],
  );

  const product = useMemo(
    () =>
      resolution
        ? products.find(
            (productItem) => productItem.id === resolution.productId,
          )
        : undefined,
    [products, resolution],
  );

  const availableVariants = useMemo(
    () =>
      product
        ? productVariants.filter(
            (variant) => variant.productId === product.id && variant.isActive,
          )
        : [],
    [product, productVariants],
  );

  const variantChoices = useMemo<VariantChoice[]>(() => {
    return availableVariants.map((variant) => {
      const rawColor = variant.attributes?.color || "";
      const rawSize = variant.attributes?.size || "";

      const colorById = getColorById(rawColor);
      const colorByName = colors.find(
        (color) => color.name.toLowerCase() === String(rawColor).toLowerCase(),
      );
      const colorLabel =
        colorById?.name || colorByName?.name || rawColor || "Sin color";
      const colorHex = colorById?.hex || colorByName?.hex || undefined;
      const sizeLabel = getSizeById(rawSize)?.name || rawSize || "Única";

      const attributeLabel = Object.values(variant.attributes || {})
        .filter(Boolean)
        .join(" / ");

      return {
        id: variant.id,
        label: attributeLabel || variant.variantCode,
        colorName: colorLabel,
        colorHex,
        sizeLabel,
        priceRent: variant.priceRent,
        priceSell: variant.priceSell,
        rentUnit: variant.rentUnit,
      };
    });
  }, [availableVariants, colors, getColorById, getSizeById]);

  const [variantOverrideId, setVariantOverrideId] = useState<string | null>(
    null,
  );

  const selectedVariantId = useMemo(() => {
    if (
      variantOverrideId &&
      variantChoices.some((variant) => variant.id === variantOverrideId)
    ) {
      return variantOverrideId;
    }

    const preferredVariantId = initialVariantId || resolution?.variantId;
    if (
      preferredVariantId &&
      variantChoices.some((variant) => variant.id === preferredVariantId)
    ) {
      return preferredVariantId;
    }

    return variantChoices[0]?.id || "";
  }, [
    initialVariantId,
    resolution?.variantId,
    variantChoices,
    variantOverrideId,
  ]);

  const selectedVariant = variantChoices.find(
    (variant) => variant.id === selectedVariantId,
  );
  const selectedVariantRaw = availableVariants.find(
    (variant) => variant.id === selectedVariantId,
  );

  const activePromos = useMemo(() => {
    const now = new Date();
    return promotions.filter((promo) => {
      if (!promo.isActive) return false;
      if (promo.startDate && new Date(promo.startDate) > now) return false;
      if (promo.endDate && new Date(promo.endDate) < now) return false;
      if (promo.branchIds?.length && !promo.branchIds.includes(currentBranchId))
        return false;
      if (promo.usageType && promo.usageType !== "automatic") return false;
      return true;
    });
  }, [promotions, currentBranchId]);

  const bestPromoRent = useMemo(() => {
    if (!product?.can_rent || !selectedVariant?.priceRent) return null;
    const basePrice = selectedVariant.priceRent;
    const applicable = activePromos.filter((promo) =>
      promo.appliesTo.includes("alquiler"),
    );
    const result = calculateBestPromotionForProduct(
      product,
      basePrice,
      applicable,
    );
    const promotion = result.promotionId
      ? activePromos.find((promo) => promo.id === result.promotionId)
      : undefined;
    return {
      ...result,
      promotion,
    };
  }, [activePromos, product, selectedVariant]);

  const bestPromoSell = useMemo(() => {
    if (!product?.can_sell || !selectedVariant?.priceSell) return null;
    const basePrice = selectedVariant.priceSell;
    const applicable = activePromos.filter((promo) =>
      promo.appliesTo.includes("venta"),
    );
    const result = calculateBestPromotionForProduct(
      product,
      basePrice,
      applicable,
    );
    const promotion = result.promotionId
      ? activePromos.find((promo) => promo.id === result.promotionId)
      : undefined;
    return {
      ...result,
      promotion,
    };
  }, [activePromos, product, selectedVariant]);

  const serialEntries = useMemo(() => {
    if (!product || !selectedVariantId) return [];
    return inventoryItems.filter(
      (item) =>
        item.productId === product.id &&
        item.variantId === selectedVariantId &&
        item.status === "disponible",
    );
  }, [inventoryItems, product, selectedVariantId]);

  const lotEntries = useMemo(() => {
    if (!product || !selectedVariantId) return [];
    return stockLots.filter(
      (stockLot) =>
        stockLot.productId === product.id &&
        stockLot.variantId === selectedVariantId &&
        stockLot.status === "disponible" &&
        stockLot.quantity > 0,
    );
  }, [product, selectedVariantId, stockLots]);

  const stockEntries = useMemo(
    () => [...serialEntries, ...lotEntries],
    [lotEntries, serialEntries],
  );

  const availability = useMemo(() => {
    const local = stockEntries
      .filter((entry) => entry.branchId === currentBranchId)
      .reduce(
        (acc, entry) => acc + ("quantity" in entry ? entry.quantity : 1),
        0,
      );
    const total = stockEntries.reduce(
      (acc, entry) => acc + ("quantity" in entry ? entry.quantity : 1),
      0,
    );
    const sale = stockEntries
      .filter((entry) => entry.branchId === currentBranchId && entry.isForSale)
      .reduce(
        (acc, entry) => acc + ("quantity" in entry ? entry.quantity : 1),
        0,
      );
    const rent = stockEntries
      .filter((entry) => entry.branchId === currentBranchId && entry.isForRent)
      .reduce(
        (acc, entry) => acc + ("quantity" in entry ? entry.quantity : 1),
        0,
      );

    return {
      local,
      total,
      remote: Math.max(0, total - local),
      sale,
      rent,
    };
  }, [currentBranchId, stockEntries]);

  const branchRows = useMemo(() => {
    const map = new Map<string, number>();
    stockEntries.forEach((entry) => {
      const current = map.get(entry.branchId) || 0;
      map.set(
        entry.branchId,
        current + ("quantity" in entry ? entry.quantity : 1),
      );
    });

    return Array.from(map.entries()).map(([branchId, qty]) => {
      const branch = MOCK_BRANCHES.find(
        (branchItem) => branchItem.id === branchId,
      );
      const isLocal = branchId === currentBranchId;
      const transferDays = !isLocal
        ? getEstimatedTransferTime(
            branchId,
            currentBranchId,
            BUSINESS_RULES_MOCK,
          )
        : 0;

      return {
        branchId,
        branchName: branch?.name || branchId,
        qty,
        isLocal,
        transferDays,
      };
    });
  }, [currentBranchId, stockEntries]);

  const remoteWithStock = branchRows.find((row) => !row.isLocal && row.qty > 0);
  const canReserve = stockEntries.some(
    (entry) => entry.isForRent || entry.isForSale,
  );

  const selectedImage = selectedVariantRaw?.image || product?.image;

  if (!product || !resolution) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            <Box className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No se encontró un producto para:</p>
            <code className="text-sm bg-muted px-2 py-1 rounded mt-2 inline-block">
              {lookup}
            </code>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryName = product.categoryId
    ? getCategoryById(product.categoryId)?.name || "General"
    : "General";
  const modelName = product.modelId ? getModelById(product.modelId)?.name : "";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header - z-40 para estar por debajo del header principal de la app */}
      <div className="sticky top-8 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {resolution.matchType}
            </Badge>
            <Badge
              variant={product.is_serial ? "default" : "secondary"}
              className="text-xs"
            >
              {product.is_serial ? "Serializado" : "Lote"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr] xl:grid-cols-[440px_1fr]">
          {/* Columna izquierda - Imagen y datos básicos */}
          <div className="space-y-4 lg:sticky lg:top-20 self-start">
            {/* Imagen del producto */}
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt={product.name}
                    fill
                    className="object-contain"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Box className="w-16 h-16 opacity-30" />
                  </div>
                )}
              </div>
            </Card>

            {/* Info rápida del producto */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    SKU
                  </p>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded block">
                    {product.baseSku}
                  </code>
                </div>

                {modelName && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Modelo
                    </p>
                    <p className="text-sm font-medium">{modelName}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Categoría
                  </p>
                  <div className="flex items-center gap-2">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">{categoryName}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Identificadores
                  </p>
                  <div className="space-y-1">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded block">
                      Product ID: {product.id}
                    </code>
                    {selectedVariantRaw?.variantCode && (
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded block">
                        Variant: {selectedVariantRaw.variantCode}
                      </code>
                    )}
                    {selectedVariantRaw?.barcode && (
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded block">
                        Barcode: {selectedVariantRaw.barcode}
                      </code>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Stock resumen compacto */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                    <p className="text-xs text-green-600 mb-1">Local</p>
                    <p className="text-xl font-bold text-green-700">
                      {availability.local}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                    <p className="text-xs text-blue-600 mb-1">Otras</p>
                    <p className="text-xl font-bold text-blue-700">
                      {availability.remote}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Info principal */}
          <div className="space-y-6">
            {/* Título y descripción */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {product.name}
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                {product.description || "Sin descripción disponible."}
              </p>
            </div>

            {/* Grid de variantes y precios */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Selector de variantes */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">Variantes disponibles</h3>
                  </div>

                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-2 pb-2">
                      {variantChoices.map((variant) => {
                        const active = variant.id === selectedVariantId;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => setVariantOverrideId(variant.id)}
                            className={cn(
                              "shrink-0 rounded-lg border px-4 py-3 text-left transition-all",
                              active
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "hover:border-primary/40 bg-background",
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {variant.colorHex && (
                                <span
                                  className="h-3 w-3 rounded-full border border-white/50"
                                  style={{ backgroundColor: variant.colorHex }}
                                />
                              )}
                              <span className="font-medium text-sm">
                                {variant.colorName}
                              </span>
                            </div>
                            <div className="text-xs opacity-90">
                              {variant.sizeLabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>

                  {/* Detalle de variante seleccionada */}
                  {selectedVariant && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Variante</span>
                        <span className="font-medium">
                          {selectedVariant.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Color</span>
                        <div className="flex items-center gap-2">
                          {selectedVariant.colorHex && (
                            <span
                              className="h-3 w-3 rounded-full border"
                              style={{
                                backgroundColor: selectedVariant.colorHex,
                              }}
                            />
                          )}
                          <span>{selectedVariant.colorName}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Talla</span>
                        <span>{selectedVariant.sizeLabel}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Precios */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">Precios</h3>
                  </div>

                  {selectedVariant ? (
                    <div className="space-y-4">
                      <div className="flex items-baseline justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="text-xs text-green-600 font-medium uppercase">
                            Alquiler
                          </p>
                          {bestPromoRent && bestPromoRent.discount > 0 ? (
                            <div>
                              <p className="text-xs line-through text-green-800/60">
                                {formatCurrency(selectedVariant.priceRent || 0)}
                              </p>
                              <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(bestPromoRent.finalPrice)}
                              </p>
                              <p className="text-xs text-green-700 font-medium">
                                Ahorro: {formatCurrency(bestPromoRent.discount)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-green-700">
                              {formatCurrency(selectedVariant.priceRent || 0)}
                            </p>
                          )}
                        </div>
                        {selectedVariant.rentUnit && (
                          <Badge variant="outline" className="bg-white">
                            /{selectedVariant.rentUnit}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <p className="text-xs text-blue-600 font-medium uppercase">
                            Venta
                          </p>
                          {bestPromoSell && bestPromoSell.discount > 0 ? (
                            <div>
                              <p className="text-xs line-through text-blue-800/60">
                                {formatCurrency(selectedVariant.priceSell || 0)}
                              </p>
                              <p className="text-2xl font-bold text-blue-700">
                                {formatCurrency(bestPromoSell.finalPrice)}
                              </p>
                              <p className="text-xs text-blue-700 font-medium">
                                Ahorro: {formatCurrency(bestPromoSell.discount)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-2xl font-bold text-blue-700">
                              {formatCurrency(selectedVariant.priceSell || 0)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Selecciona una variante
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Disponibilidad por sucursal */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold">
                    Disponibilidad por ubicación
                  </h3>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {branchRows.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/30 rounded-lg">
                      <Box className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin stock disponible</p>
                    </div>
                  ) : (
                    branchRows.map((row) => (
                      <div
                        key={row.branchId}
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          row.isLocal
                            ? "bg-green-50 border-green-200"
                            : "bg-background hover:bg-muted/50",
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {row.isLocal ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Truck className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span
                              className={cn(
                                "font-medium text-sm",
                                row.isLocal && "text-green-900",
                              )}
                            >
                              {row.branchName}
                            </span>
                          </div>
                          <Badge
                            variant={row.isLocal ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {row.qty}
                          </Badge>
                        </div>

                        {!row.isLocal && row.qty > 0 && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Clock className="w-3 h-3" />
                            <span>Traslado: {row.transferDays}d hábiles</span>
                          </div>
                        )}

                        {row.isLocal && (
                          <p className="text-xs text-green-600 font-medium">
                            Disponible ahora
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold">Promociones</h3>
                </div>

                {!bestPromoRent?.promotion && !bestPromoSell?.promotion && (
                  <p className="text-sm text-muted-foreground">
                    No hay promociones automáticas activas para esta variante.
                  </p>
                )}

                {bestPromoRent?.promotion && (
                  <div className="rounded-lg border p-3 bg-green-50/50 border-green-200">
                    <p className="text-xs uppercase text-green-700 font-semibold">
                      Promo alquiler
                    </p>
                    <p className="text-sm font-semibold">
                      {bestPromoRent.promotion.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Motivo: {bestPromoRent.reason || "Descuento aplicado"}
                    </p>
                    <p className="text-xs text-green-700 font-medium">
                      Descuento:{" "}
                      {bestPromoRent.promotion.type === "percentage"
                        ? `${bestPromoRent.promotion.value || 0}%`
                        : formatCurrency(bestPromoRent.discount)}
                    </p>
                  </div>
                )}

                {bestPromoSell?.promotion && (
                  <div className="rounded-lg border p-3 bg-blue-50/50 border-blue-200">
                    <p className="text-xs uppercase text-blue-700 font-semibold">
                      Promo venta
                    </p>
                    <p className="text-sm font-semibold">
                      {bestPromoSell.promotion.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Motivo: {bestPromoSell.reason || "Descuento aplicado"}
                    </p>
                    <p className="text-xs text-blue-700 font-medium">
                      Descuento:{" "}
                      {bestPromoSell.promotion.type === "percentage"
                        ? `${bestPromoSell.promotion.value || 0}%`
                        : formatCurrency(bestPromoSell.discount)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold">Detalle de stock visible</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded border p-2 bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase">
                      Serializados
                    </p>
                    <p className="font-semibold">{serialEntries.length}</p>
                  </div>
                  <div className="rounded border p-2 bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase">
                      Lotes
                    </p>
                    <p className="font-semibold">{lotEntries.length}</p>
                  </div>
                </div>

                {serialEntries.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-muted-foreground">
                      Serial codes (muestra)
                    </p>
                    {serialEntries.slice(0, 5).map((serial) => (
                      <code
                        key={serial.id}
                        className="text-xs font-mono bg-muted px-2 py-1 rounded block"
                      >
                        {serial.serialCode}
                      </code>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acciones principales */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <FeatureGuard feature="rentals">
                    <DirectTransactionModal
                      item={product}
                      variantId={selectedVariantId}
                      type="alquiler"
                      currentBranchId={currentBranchId}
                    >
                      <Button
                        size="lg"
                        className="flex-1 gap-2 h-14 text-lg"
                        disabled={availability.rent <= 0}
                      >
                        <CalendarClock className="w-5 h-5" />
                        <div className="text-left">
                          <p className="text-sm font-medium leading-none">
                            Alquilar
                          </p>
                          <p className="text-xs opacity-80 mt-1">
                            {availability.rent} disponibles
                          </p>
                        </div>
                      </Button>
                    </DirectTransactionModal>
                  </FeatureGuard>

                  <FeatureGuard feature="sales">
                    <DirectTransactionModal
                      item={product}
                      variantId={selectedVariantId}
                      type="venta"
                      currentBranchId={currentBranchId}
                    >
                      <Button
                        size="lg"
                        variant="secondary"
                        className="flex-1 gap-2 h-14 text-lg"
                        disabled={availability.sale <= 0}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <div className="text-left">
                          <p className="text-sm font-medium leading-none">
                            Vender
                          </p>
                          <p className="text-xs opacity-80 mt-1">
                            {availability.sale} disponibles
                          </p>
                        </div>
                      </Button>
                    </DirectTransactionModal>
                  </FeatureGuard>

                  <FeatureGuard feature="reservations">
                    <ReservationModal
                      item={product}
                      variantId={selectedVariantId}
                      currentBranchId={currentBranchId}
                      originBranchId={
                        remoteWithStock?.branchId || currentBranchId
                      }
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="flex-1 gap-2 h-14 text-lg"
                        disabled={!canReserve}
                      >
                        <Package2 className="w-5 h-5" />
                        <div className="text-left">
                          <p className="text-sm font-medium leading-none">
                            Reservar
                          </p>
                          <p className="text-xs opacity-80 mt-1">
                            Para fecha futura
                          </p>
                        </div>
                      </Button>
                    </ReservationModal>
                  </FeatureGuard>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

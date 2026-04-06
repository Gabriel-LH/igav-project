"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import React from "react";
import type { Category } from "@/src/types/category/type.category";
import type { AttributeType } from "@/src/types/attributes/type.attribute-type";
import type { AttributeValue } from "@/src/types/attributes/type.attribute-value";
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
  Loader,
} from "lucide-react";
import { formatCurrency } from "@/src/utils/currency-format";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import { DirectTransactionModal } from "./ui/direct-transaction/DirectTransactionModal";
import { ReservationModal } from "./ui/reservation/ReservationModal";
import { FeatureGuard } from "@/src/components/tenant/guards/FeatureGuard";
import { resolveProductLookup } from "@/src/utils/product/resolveProductLookup";
import { cn } from "@/lib/utils";
import { useBranchStore } from "@/src/store/useBranchStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { usePromotionStore } from "@/src/store/usePromotionStore";
import { calculateBestPromotionForProduct } from "@/src/utils/promotion/promotio.engine";
import { getBranchInventoryAction } from "@/src/app/(tenant)/tenant/actions/inventory.actions";
import { getAvailabilityCalendarDataAction } from "@/src/app/(tenant)/tenant/actions/availability.actions";
import type { Product } from "@/src/types/product/type.product";
import type { ProductVariant } from "@/src/types/product/type.productVariant";
import type { InventoryItem } from "@/src/types/product/type.inventoryItem";
import type { StockLot } from "@/src/types/product/type.stockLote";
import { toast } from "sonner";
import { useReservationStore } from "@/src/store/useReservationStore";
import { useRentalStore } from "@/src/store/useRentalStore";
import { useAttributeStore } from "@/src/store/useAttributeStore";
import { Promotion } from "@/src/types/promotion/type.promotion";

export interface ProductDetailsPageProps {
  lookup: string;
  initialVariantId?: string;
  categories: Category[];
  attributeTypes: AttributeType[];
  attributeValues: AttributeValue[];
  initialPromotions?: Promotion[];
}

export type DisplayAttributeValue = {
  keyName: string;
  name: string;
  hex?: string;
  isColor: boolean;
};

interface VariantChoice {
  id: string;
  label: string;
  priceRent?: number;
  priceSell?: number;
  rentUnit?: string;
  image?: string[];
  allAttributes: DisplayAttributeValue[];
}

export function ProductDetailsPage({
  lookup,
  initialVariantId,
  categories,
  attributeTypes,
  attributeValues,
  initialPromotions = [],
}: ProductDetailsPageProps) {
  const router = useRouter();
  const currentBranchId = useBranchStore((s) => s.selectedBranchId);
  const branches = useBranchStore((s) => s.branches);
  const setProductsInStore = useInventoryStore((s) => s.setProducts);
  const setVariantsInStore = useInventoryStore((s) => s.setProductVariants);
  const setInventoryItemsInStore = useInventoryStore(
    (s) => s.setInventoryItems,
  );
  const setStockLotsInStore = useInventoryStore((s) => s.setStockLots);
  const setReservationData = useReservationStore((s) => s.setReservationData);
  const setRentalData = useRentalStore((s) => s.setRentalData);
  const { getModelById } = useAttributeStore();
  const { promotions, setPromotions } = usePromotionStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockLots, setStockLots] = useState<StockLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true }),
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchInventory() {
      if (!currentBranchId) return;
      setIsLoading(true);
      try {
        const [inventoryResult, availabilityResult] = await Promise.all([
          getBranchInventoryAction(currentBranchId),
          getAvailabilityCalendarDataAction(),
        ]);

        if (!cancelled && inventoryResult.success && inventoryResult.data) {
          setProducts(inventoryResult.data.products as Product[]);
          setProductVariants(inventoryResult.data.variants as ProductVariant[]);
          setInventoryItems(
            inventoryResult.data.inventoryItems as InventoryItem[],
          );
          setStockLots(inventoryResult.data.stockLots as StockLot[]);
          setProductsInStore(inventoryResult.data.products as Product[]);
          setVariantsInStore(inventoryResult.data.variants as ProductVariant[]);
          setInventoryItemsInStore(
            inventoryResult.data.inventoryItems as InventoryItem[],
          );
          setStockLotsInStore(inventoryResult.data.stockLots as StockLot[]);
        }

        if (
          !cancelled &&
          availabilityResult.success &&
          availabilityResult.data
        ) {
          setReservationData(
            availabilityResult.data.reservations,
            availabilityResult.data.reservationItems,
          );
          setRentalData(
            availabilityResult.data.rentals,
            availabilityResult.data.rentalItems,
          );
        }
      } catch (error) {
        toast.error("Error al cargar el inventario", {
          description: error as string,
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchInventory();

    return () => {
      cancelled = true;
    };
  }, [
    currentBranchId,
    setInventoryItemsInStore,
    setProductsInStore,
    setRentalData,
    setReservationData,
    setStockLotsInStore,
    setVariantsInStore,
  ]);

  useEffect(() => {
    if (initialPromotions.length > 0) {
      setPromotions(initialPromotions);
    }
  }, [initialPromotions, setPromotions]);

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
      const resolvedAttributes: DisplayAttributeValue[] = [];

      Object.keys(variant.attributes || {}).forEach((candidateKey) => {
        const normalizedKey = candidateKey.trim().toLowerCase();
        const matchingType = attributeTypes.find(
          (type) =>
            type.name.trim().toLowerCase() === normalizedKey ||
            type.code.trim().toLowerCase() === normalizedKey,
        );

        const rawValue = variant.attributes?.[candidateKey];
        if (!rawValue) return;

        const normalizedValue = String(rawValue).trim().toLowerCase();
        const matchingAttributeValue = attributeValues.find((value) => {
          if (matchingType && value.attributeTypeId !== matchingType.id) {
            return false;
          }
          return (
            value.id === rawValue ||
            value.value.trim().toLowerCase() === normalizedValue ||
            value.code.trim().toLowerCase() === normalizedValue
          );
        });

        const resolvedName = matchingAttributeValue?.value || String(rawValue);
        const resolvedHex = matchingAttributeValue?.hexColor || undefined;
        const isColor =
          matchingType?.inputType === "color" || Boolean(resolvedHex);

        resolvedAttributes.push({
          keyName: matchingType?.name || candidateKey,
          name: resolvedName,
          hex: resolvedHex,
          isColor,
        });
      });

      const attributeLabel = resolvedAttributes.map((a) => a.name).join(" / ");

      return {
        id: variant.id,
        label: attributeLabel || variant.variantCode,
        priceRent: variant.priceRent,
        priceSell: variant.priceSell,
        rentUnit: variant.rentUnit,
        image: variant.image,
        allAttributes: resolvedAttributes,
      };
    });
  }, [availableVariants, attributeTypes, attributeValues]);

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
      const branch = branches.find((branchItem) => branchItem.id === branchId);
      const isLocal = branchId === currentBranchId;
      const transferHours = !isLocal
        ? getEstimatedTransferTime(
            branchId,
            currentBranchId,
            null,
          )
        : 0;

      return {
        branchId,
        branchName: branch?.name || branchId,
        qty,
        isLocal,
        transferHours,
      };
    });
  }, [currentBranchId, stockEntries, branches]);

  const remoteWithStock = branchRows.find((row) => !row.isLocal && row.qty > 0);
  const canReserve = stockEntries.some(
    (entry) => entry.isForRent || entry.isForSale,
  );

  const selectedImage = selectedVariantRaw?.image || product?.image;

  if (!product || !resolution) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-muted/30 p-6 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-b-violet-600 border-t-violet-300 mx-auto mb-4"></div>
          <p className="mt-4 text-muted-foreground animate-pulse">
            Cargando producto...
          </p>
        </div>
      );
    }
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

  const categoryName =
    categories.find((c) => c.id === product?.categoryId)?.name || "General";

  const modelName = product.modelId ? getModelById(product.modelId)?.name : "";
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header - z-40 para estar por debajo del header principal de la app */}
      <div className="sticky top-9 z-40 bg-background/55 backdrop-blur-md border-b">
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
                {selectedImage && selectedImage.length > 0 ? (
                  <Carousel
                    plugins={[plugin.current]}
                    onMouseEnter={plugin.current.stop}
                    onMouseLeave={plugin.current.reset}
                    className="w-full h-full"
                  >
                    <CarouselContent className="h-full">
                      {selectedImage.map((imageUrl: string, index: number) => (
                        <CarouselItem
                          key={index}
                          className="h-full relative aspect-square"
                        >
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-contain"
                            priority={index === 0}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {selectedImage.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
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
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-2">
                                {variant.allAttributes[0]?.isColor && (
                                  <span
                                    className="h-3 w-3 shrink-0 rounded-full border border-black/10 shadow-sm"
                                    style={{
                                      backgroundColor:
                                        variant.allAttributes[0].hex ||
                                        "#CCCCCC",
                                    }}
                                  />
                                )}
                                <span className="font-medium text-sm line-clamp-1">
                                  {variant.allAttributes[0]?.name ||
                                    variant.label}
                                </span>
                              </div>
                              {variant.allAttributes[1] && (
                                <div className="text-xs opacity-90 line-clamp-1">
                                  {variant.allAttributes[1].name}
                                </div>
                              )}
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
                      <div className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                        <span className="text-muted-foreground font-medium">
                          Variante
                        </span>
                        <span className="font-medium text-right">
                          {selectedVariant.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1">
                        {selectedVariant.allAttributes.map((attr, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm bg-background/50 px-2 py-1.5 rounded-md border"
                          >
                            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                              {attr.keyName}
                            </span>
                            {attr.isColor ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
                                  style={{
                                    backgroundColor: attr.hex || "#CCCCCC",
                                  }}
                                />
                                <span className="font-semibold text-xs">
                                  {attr.name}
                                </span>
                              </div>
                            ) : (
                              <span className="font-semibold text-xs">
                                {attr.name}
                              </span>
                            )}
                          </div>
                        ))}
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

            {/* Características */}
            {selectedVariant && selectedVariant.allAttributes.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">Características</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedVariant.allAttributes.map((attr, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-1 p-3 bg-muted/40 rounded-lg border"
                      >
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          {attr.keyName}
                        </span>
                        <div className="flex items-center gap-2">
                          {attr.isColor && (
                            <span
                              className="h-4 w-4 shrink-0 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: attr.hex || "#CCCCCC" }}
                            />
                          )}
                          <span className="font-medium text-sm leading-tight">
                            {attr.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                            <span>Traslado: {row.transferHours} h</span>
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
                      selectedVariant={selectedVariantRaw}
                      displayAttributes={selectedVariant?.allAttributes}
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
                      selectedVariant={selectedVariantRaw}
                      displayAttributes={selectedVariant?.allAttributes}
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

                  <>
                    <ReservationModal
                      item={product}
                      variantId={selectedVariantId}
                      selectedVariant={selectedVariantRaw}
                      displayAttributes={selectedVariant?.allAttributes}
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
                  </>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

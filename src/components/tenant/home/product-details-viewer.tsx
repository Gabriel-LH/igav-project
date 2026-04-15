"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Barcode,
} from "lucide-react";
import { StockAssignmentWidget } from "./ui/widget/StockAssignmentWidget";
import { useBranchStore } from "@/src/store/useBranchStore";
import { formatCurrency } from "@/src/utils/currency-format";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import { useCartStore } from "@/src/store/useCartStore"; 
import { FeatureGuard } from "@/src/components/tenant/guards/FeatureGuard";
import { resolveProductLookup } from "@/src/utils/product/resolveProductLookup";
import { useBarcodeScanner } from "@/src/hooks/useBarcodeScanner";
import { cn } from "@/lib/utils";
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

export interface ProductDetailsViewerProps {
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

export function ProductDetailsViewer({
  lookup,
  initialVariantId,
  categories,
  attributeTypes,
  attributeValues,
  initialPromotions = [],
}: ProductDetailsViewerProps) {
  const router = useRouter();
  const currentBranchId = useBranchStore((s) => s.selectedBranchId);
  const branches = useBranchStore((s) => s.branches);
  const pd_setProductsInStore = useInventoryStore((s) => s.setProducts);
  const pd_setVariantsInStore = useInventoryStore((s) => s.setProductVariants);
  const pd_setInventoryItemsInStore = useInventoryStore(
    (s) => s.setInventoryItems,
  );
  const pd_setStockLotsInStore = useInventoryStore((s) => s.setStockLots);
  const pd_setReservationData = useReservationStore((s) => s.setReservationData);
  const pd_setRentalData = useRentalStore((s) => s.setRentalData);
  const { getModelById } = useAttributeStore();
  const { promotions, setPromotions } = usePromotionStore();
  const addItem = useCartStore((s) => s.addItem); 

  const [pd_products, pd_setProducts] = useState<Product[]>([]);
  const [pd_variants, pd_setVariants] = useState<ProductVariant[]>([]);
  const [pd_inventoryItems, pd_setInventoryItems] = useState<InventoryItem[]>([]);
  const [pd_stockLots, pd_setStockLots] = useState<StockLot[]>([]);
  const [pd_isLoading, pd_setIsLoading] = useState(true);
  const [pd_selectedStockIds, pd_setSelectedStockIds] = useState<string[]>([]);
  
  const searchParams = useSearchParams();
  const preselectCode = searchParams.get("preselect");

  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true }),
  );

  // --- 1. MEMOS (Dependency Chain) --- 
  const resolution = useMemo(
    () =>
      resolveProductLookup({
        products: pd_products,
        productVariants: pd_variants,
        inventoryItems: pd_inventoryItems,
        stockLots: pd_stockLots,
        lookup,
      }),
    [pd_inventoryItems, lookup, pd_variants, pd_products, pd_stockLots],
  );

  const product = useMemo(
    () =>
      resolution
        ? pd_products.find(
            (productItem) => productItem.id === resolution.productId,
          )
        : undefined,
    [pd_products, resolution],
  );

  const availableVariants = useMemo(
    () =>
      product
        ? pd_variants.filter(
            (variant) => variant.productId === product.id && variant.isActive,
          )
        : [],
    [product, pd_variants],
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

  const serialEntries = useMemo(() => {
    if (!product || !selectedVariantId) return [];
    return pd_inventoryItems.filter(
      (item) =>
        item.productId === product.id &&
        item.variantId === selectedVariantId &&
        item.status === "disponible",
    );
  }, [pd_inventoryItems, product, selectedVariantId]);

  const lotEntries = useMemo(() => {
    if (!product || !selectedVariantId) return [];
    return pd_stockLots.filter(
      (stockLot) =>
        stockLot.productId === product.id &&
        stockLot.variantId === selectedVariantId &&
        stockLot.status === "disponible" &&
        stockLot.quantity > 0,
    );
  }, [product, selectedVariantId, pd_stockLots]);

  const pd_allCalculatedEntries = useMemo(
    () => [...serialEntries, ...lotEntries],
    [lotEntries, serialEntries],
  );

  const availability = useMemo(() => {
    const local = pd_allCalculatedEntries
      .filter((entry) => entry.branchId === currentBranchId)
      .reduce(
        (acc, entry) => acc + ("quantity" in entry ? entry.quantity : 1),
        0,
      );
    const total = pd_allCalculatedEntries.reduce(
      (acc, entry) => acc + ("quantity" in entry ? entry.quantity : 1),
      0,
    );
    const sale = pd_allCalculatedEntries
      .filter((entry) => entry.branchId === currentBranchId && entry.isForSale)
      .reduce(
        (acc, entry) => acc + ("quantity" in entry ? entry.quantity : 1),
        0,
      );
    const rent = pd_allCalculatedEntries
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
  }, [currentBranchId, pd_allCalculatedEntries]);

  const branchRows = useMemo(() => {
    const map = new Map<string, number>();
    pd_allCalculatedEntries.forEach((entry) => {
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
  }, [currentBranchId, pd_allCalculatedEntries, branches]);

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

  const remoteWithStock = branchRows.find((row) => !row.isLocal && row.qty > 0);
  const canReserve = pd_allCalculatedEntries.some(
    (entry) => entry.isForRent || entry.isForSale,
  );
  const selectedImage = selectedVariantRaw?.image || product?.image;

  // --- 2. EFECTOS & HOOKS ---
  useEffect(() => {
    if (initialPromotions.length > 0) {
      setPromotions(initialPromotions);
    }
  }, [initialPromotions, setPromotions]);

  useEffect(() => {
    let cancelled = false;

    async function fetchInventory() {
      if (!currentBranchId) return;
      pd_setIsLoading(true);
      try {
        const [inventoryResult, availabilityResult] = await Promise.all([
          getBranchInventoryAction(currentBranchId),
          getAvailabilityCalendarDataAction(),
        ]);

        if (!cancelled && inventoryResult.success && inventoryResult.data) {
          pd_setProducts(inventoryResult.data.products as Product[]);
          pd_setVariants(inventoryResult.data.variants as ProductVariant[]);
          pd_setInventoryItems(
            inventoryResult.data.inventoryItems as InventoryItem[],
          );
          pd_setStockLots(inventoryResult.data.stockLots as StockLot[]);
          
          pd_setProductsInStore(inventoryResult.data.products as Product[]);
          pd_setVariantsInStore(inventoryResult.data.variants as ProductVariant[]);
          pd_setInventoryItemsInStore(
            inventoryResult.data.inventoryItems as InventoryItem[],
          );
          pd_setStockLotsInStore(inventoryResult.data.stockLots as StockLot[]);
        }

        if (
          !cancelled &&
          availabilityResult.success &&
          availabilityResult.data
        ) {
          pd_setReservationData(
            availabilityResult.data.reservations,
            availabilityResult.data.reservationItems,
          );
          pd_setRentalData(
            availabilityResult.data.rentals,
            availabilityResult.data.rentalItems,
          );
        }
      } catch (error) {
        toast.error("Error al cargar el inventario", {
          description: error as string,
        });
      } finally {
        if (!cancelled) pd_setIsLoading(false);
      }
    }

    fetchInventory();

    return () => {
      cancelled = true;
    };
  }, [
    currentBranchId,
    pd_setInventoryItemsInStore,
    pd_setProductsInStore,
    pd_setRentalData,
    pd_setReservationData,
    pd_setStockLotsInStore,
    pd_setVariantsInStore,
  ]);

  useEffect(() => {
    if (preselectCode && pd_allCalculatedEntries.length > 0) {
      const found = pd_allCalculatedEntries.find(s => 
        (s as any).serialCode === preselectCode || s.id === preselectCode || (s as any).barcode === preselectCode
      );
      if (found && !pd_selectedStockIds.includes(found.id)) {
        pd_setSelectedStockIds([found.id]);
        toast.success(`Prenda ${preselectCode} marcada como elegida`);
      }
    }
  }, [preselectCode, pd_allCalculatedEntries, pd_selectedStockIds]);

  useBarcodeScanner({
    onScan: (code) => {
      const localFound = pd_allCalculatedEntries.find(s => 
        (s as any).serialCode === code || s.id === code || (s as any).barcode === code
      );

      if (localFound) {
        if (!pd_selectedStockIds.includes(localFound.id)) {
          pd_setSelectedStockIds(prev => [...prev, localFound.id]);
          toast.success(`Prenda añadida: ${code}`);
        } else {
          toast.info("Esta prenda ya está seleccionada");
        }
        return;
      }

      const res = resolveProductLookup({
        products: pd_products, 
        productVariants: pd_variants, 
        inventoryItems: pd_inventoryItems, 
        stockLots: pd_stockLots, 
        lookup: code
      });

      if (res) {
          const isSpecific = ["serialCode", "inventoryItemId", "stockLotId", "stockLotBarcode"].includes(res.matchType);
          const preParam = isSpecific ? `&preselect=${encodeURIComponent(code)}` : "";
          const vQuery = res.variantId ? `?variantId=${encodeURIComponent(res.variantId)}` : "?v=1";
          router.push(`/product-details/${encodeURIComponent(code)}${vQuery}${preParam}`);
      } else {
          toast.error(`Código no reconocido: ${code}`);
      }
    }
  });

  // --- 3. HANDLERS ---
  const handleAddToCart = (type: "venta" | "alquiler") => {
    if (!product) return;

    if (pd_selectedStockIds.length > 0) {
      pd_selectedStockIds.forEach((id) => {
        addItem(
          product,
          type,
          id,
          1,
          selectedVariantId,
        );
      });
      pd_setSelectedStockIds([]);
    } else {
      addItem(
        product,
        type,
        undefined,
        type === "venta" ? availability.sale : availability.rent,
        selectedVariantId,
      );
    }

    toast.success(`Producto añadido al carrito (${type.toUpperCase()})`, {
      description: `${product.name} listo para procesar en caja.`,
    });
  };

  if (!product || !resolution) {
    if (pd_isLoading) {
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

  const pd_modelName = product.modelId ? getModelById(product.modelId)?.name : "";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
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

                {pd_modelName && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Modelo
                    </p>
                    <p className="text-sm font-medium">{pd_modelName}</p>
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
                    Stocks
                  </p>
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Info principal */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {product.name}
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                {product.description || "Sin descripción disponible."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">Variantes disponibles</h3>
                  </div>

                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-2 pb-2">
                      {variantChoices.map((v) => {
                        const active = v.id === selectedVariantId;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setVariantOverrideId(v.id)}
                            className={cn(
                              "shrink-0 rounded-lg border px-4 py-3 text-left transition-all",
                              active
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "hover:border-primary/40 bg-background",
                            )}
                          >
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-2">
                                {v.allAttributes[0]?.isColor && (
                                  <span
                                    className="h-3 w-3 shrink-0 rounded-full border border-black/10 shadow-sm"
                                    style={{
                                      backgroundColor:
                                        v.allAttributes[0].hex ||
                                        "#CCCCCC",
                                    }}
                                  />
                                )}
                                <span className="font-medium text-sm line-clamp-1">
                                  {v.allAttributes[0]?.name || v.label}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Precios */}
              <div className="space-y-4">
                {product.can_sell && selectedVariant?.priceSell && (
                  <Card className={cn(
                    "relative overflow-hidden transition-all",
                    bestPromoSell?.promotion ? "border-amber-200 bg-amber-50/30" : ""
                  )}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-muted-foreground uppercase">Venta</span>
                        {bestPromoSell?.promotion && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                            {bestPromoSell.promotion.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {formatCurrency(bestPromoSell?.discountedPrice || selectedVariant.priceSell)}
                        </span>
                        {bestPromoSell?.promotion && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(selectedVariant.priceSell)}
                          </span>
                        )}
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        disabled={availability.sale === 0}
                        onClick={() => handleAddToCart("venta")}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Añadir a Venta
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {product.can_rent && selectedVariant?.priceRent && (
                  <Card className={cn(
                    "relative overflow-hidden transition-all",
                    bestPromoRent?.promotion ? "border-violet-200 bg-violet-50/30" : ""
                  )}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-muted-foreground uppercase">Alquiler</span>
                        {bestPromoRent?.promotion && (
                          <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-200">
                            {bestPromoRent.promotion.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {formatCurrency(bestPromoRent?.discountedPrice || selectedVariant.priceRent)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          / {selectedVariant.rentUnit || "día"}
                        </span>
                      </div>
                      <Button 
                        variant="secondary" 
                        className="w-full mt-4"
                        disabled={availability.rent === 0}
                        onClick={() => handleAddToCart("alquiler")}
                      >
                        <CalendarClock className="w-4 h-4 mr-2" />
                        Añadir a Alquiler
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Selector de Prenda Específica (Stock) */}
            {pd_allCalculatedEntries.length > 0 && (
              <Card className="border-blue-100 bg-blue-50/30 overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Barcode className="w-4 h-4" />
                    <h3 className="font-semibold">Buscador y Selección de Prendas</h3>
                  </div>
                  <p className="text-xs text-blue-600">
                    Selecciona prendas específicas de la lista o escanea códigos para marcarlas.
                  </p>
                  
                  <StockAssignmentWidget
                    productId={product.id}
                    variantId={selectedVariantId}
                    quantity={1}
                    operationType="venta"
                    dateRange={{ from: new Date(), to: new Date() }}
                    currentBranchId={currentBranchId}
                    isSerial={product.is_serial}
                    onAssignmentChange={pd_setSelectedStockIds}
                    initialSelections={pd_selectedStockIds}
                  />
                </CardContent>
              </Card>
            )}

            {/* Disponibilidad por Sucursal */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold">Disponibilidad en Sucursales</h3>
                </div>
                <div className="space-y-3">
                  {branchRows.map((row) => (
                    <div key={row.branchId} className="flex items-center justify-between p-2 rounded-lg border bg-background/50">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium flex items-center gap-2">
                          {row.branchName}
                          {row.isLocal && <Badge variant="secondary" className="text-[10px] h-4">Local</Badge>}
                        </span>
                        {!row.isLocal && row.qty > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            Transf. estimada: {row.transferHours}h
                          </span>
                        )}
                      </div>
                      <Badge variant={row.qty > 0 ? "default" : "outline"} className={cn(
                        row.qty > 0 ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : "opacity-30"
                      )}>
                        {row.qty} unid.
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

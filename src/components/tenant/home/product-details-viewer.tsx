"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import type { Category } from "@/src/types/category/type.category";
import type { AttributeType } from "@/src/types/attributes/type.attribute-type";
import type { AttributeValue } from "@/src/types/attributes/type.attribute-value";
import {
  ArrowLeft,
  CalendarClock,
  ShoppingCart,
  MapPin,
  Truck,
  Box,
  Tag,
  CheckCircle2,
  Barcode,
  ListChecks,
  Minus,
  Plus,
  Camera,
} from "lucide-react";
import { ScannerModal } from "./ui/modals/ScannerModal";
import { StockAssignmentWidget } from "./ui/widget/StockAssignmentWidget";
import { useBranchStore } from "@/src/store/useBranchStore";
import { formatCurrency } from "@/src/utils/currency-format";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
// Force refresh triggered to clear lucide-react module evaluation cache.
import { useCartStore } from "@/src/store/useCartStore";
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
  sku: string;
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
  const pd_setReservationData = useReservationStore(
    (s) => s.setReservationData,
  );
  const pd_setRentalData = useRentalStore((s) => s.setRentalData);
  const { getModelById } = useAttributeStore();
  const { promotions, setPromotions } = usePromotionStore();
  const { addItem, isCollectorMode } = useCartStore();

  const [pd_products, pd_setProducts] = useState<Product[]>([]);
  const [pd_variants, pd_setVariants] = useState<ProductVariant[]>([]);
  const [pd_inventoryItems, pd_setInventoryItems] = useState<InventoryItem[]>(
    [],
  );
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
        sku: variant.variantCode,
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

  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  // Memo for all possible attribute options grouped by their type
  const allAttributeOptions = useMemo(() => {
    const groups: Record<string, DisplayAttributeValue[]> = {};
    variantChoices.forEach((vc) => {
      vc.allAttributes.forEach((attr) => {
        if (!groups[attr.keyName]) groups[attr.keyName] = [];
        if (!groups[attr.keyName].find((v) => v.name === attr.name)) {
          groups[attr.keyName].push(attr);
        }
      });
    });
    return groups;
  }, [variantChoices]);

  // Sync local selected attributes with the actual selected variant
  useEffect(() => {
    const currentVariant = variantChoices.find(
      (v) => v.id === selectedVariantId,
    );
    if (currentVariant) {
      const newAttrs: Record<string, string> = {};
      currentVariant.allAttributes.forEach((a) => {
        newAttrs[a.keyName] = a.name;
      });
      setSelectedAttributes(newAttrs);
    }
  }, [selectedVariantId, variantChoices]);

  // Helper to check if a specific attribute value exists for ANY variant
  // (Can be improved to check if it exists for CURRENT selection)
  const isOptionAvailable = (key: string, value: string) => {
    return availableVariants.some((v) => {
      const match =
        v.attributes &&
        (v.attributes[key] === value ||
          Object.values(v.attributes).includes(value));
      return match;
    });
  };

  const handleAttributeSelect = (key: string, value: string) => {
    const nextAttrs = { ...selectedAttributes, [key]: value };
    setSelectedAttributes(nextAttrs);

    // Find a variant that matches the new selection
    const match = variantChoices.find((vc) => {
      return Object.entries(nextAttrs).every(([k, v]) => {
        const attr = vc.allAttributes.find((a) => a.keyName === k);
        return attr?.name === v;
      });
    });

    if (match) {
      setVariantOverrideId(match.id);
    } else {
      // Find a variant that matches at least the clicked attribute
      const bestMatch =
        variantChoices.find((vc) => {
          const attr = vc.allAttributes.find((a) => a.keyName === key);
          return attr?.name === value;
        }) || variantChoices[0];
      if (bestMatch) setVariantOverrideId(bestMatch.id);
    }
  };

  const selectedVariant = useMemo(() => {
    return variantChoices.find((variant) => variant.id === selectedVariantId);
  }, [variantChoices, selectedVariantId]);
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
        ? getEstimatedTransferTime(branchId, currentBranchId, null)
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
          pd_setVariantsInStore(
            inventoryResult.data.variants as ProductVariant[],
          );
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
      const found = pd_allCalculatedEntries.find(
        (s) =>
          (s as any).serialCode === preselectCode ||
          s.id === preselectCode ||
          (s as any).barcode === preselectCode,
      );
      if (found && !pd_selectedStockIds.includes(found.id)) {
        pd_setSelectedStockIds([found.id]);
        toast.success(`Prenda ${preselectCode} marcada como elegida`);
      }
    }
  }, [preselectCode, pd_allCalculatedEntries, pd_selectedStockIds]);

  // --- 2.5 SCANNING LOGIC ---
  const handleBarcodeScan = useCallback(
    (code: string) => {
      // 1. ¿Es una serie/lote ya presente en esta vista?
      const localFound = pd_allCalculatedEntries.find(
        (s) =>
          (s as any).serialCode === code ||
          s.id === code ||
          (s as any).barcode === code,
      );

      if (localFound) {
        if (!pd_selectedStockIds.includes(localFound.id)) {
          pd_setSelectedStockIds((prev) => [...prev, localFound.id]);
          toast.success(`Prenda seleccionada: ${code}`);
        } else {
          toast.info("Esta prenda ya está seleccionada");
        }
        return;
      }

      // 2. ¿Es el SKU del mismo producto o variante actual?
      const isCurrentProductSKU = product?.baseSku === code;
      const matchingVariant = availableVariants.find(
        (v) => v.variantCode === code || v.barcode === code,
      );

      if (isCurrentProductSKU || matchingVariant) {
        if (matchingVariant && matchingVariant.id !== selectedVariantId) {
          setVariantOverrideId(matchingVariant.id);
          toast.success(
            `Variante cambiada: ${matchingVariant.variantCode || code}`,
          );
          return;
        }

        if (product?.is_serial) {
          toast.info(
            "Producto serializado: Escanee el código de barra de la etiqueta específica (serie).",
          );
        } else {
          // Incrementar cantidad para lotes
          setPurchaseQuantity((prev) => {
            const max = availability.sale || availability.rent || 999;
            const next = Math.min(max, prev + 1);
            toast.success(`Cantidad incrementada: ${next}`);
            return next;
          });
        }
        return;
      }

      // 3. Resolución externa (Navegar o Añadir al carro)
      const res = resolveProductLookup({
        products: pd_products,
        productVariants: pd_variants,
        inventoryItems: pd_inventoryItems,
        stockLots: pd_stockLots,
        lookup: code,
      });

      if (res) {
        if (res.productId === product?.id) {
          if (res.variantId) setVariantOverrideId(res.variantId);
          return;
        }

        // Si es collector mode, intentamos añadir directamente
        if (isCollectorMode) {
          const targetProduct = pd_products.find((p) => p.id === res.productId);
          if (targetProduct) {
            const type = targetProduct.can_rent ? "alquiler" : "venta";
            const serialId = [
              "serialCode",
              "inventoryItemId",
              "stockLotId",
            ].includes(res.matchType)
              ? res.itemId
              : undefined;

            addItem(targetProduct, type, serialId, 9999, res.variantId);
            toast.success(`Añadido al carrito: ${targetProduct.name}`);
            return;
          }
        }

        const isSpecific = [
          "serialCode",
          "inventoryItemId",
          "stockLotId",
          "stockLotBarcode",
        ].includes(res.matchType);
        const preParam = isSpecific
          ? `&preselect=${encodeURIComponent(code)}`
          : "";
        const vQuery = res.variantId
          ? `?variantId=${encodeURIComponent(res.variantId)}`
          : "?v=1";

        toast.info(`Navegando a: ${code}`);
        router.push(
          `/tenant/product-details/${encodeURIComponent(res.productId)}${vQuery}${preParam}`,
        );
      } else {
        toast.error(`Código no reconocido: ${code}`);
      }
    },
    [
      pd_allCalculatedEntries,
      pd_selectedStockIds,
      product,
      availableVariants,
      selectedVariantId,
      availability,
      pd_products,
      pd_variants,
      pd_inventoryItems,
      pd_stockLots,
      isCollectorMode,
      router,
      addItem,
    ],
  );

  const handleScannerResult = useCallback(
    (code: string) => {
      // 1. ¿Es un serial de este producto/variante?
      const foundSerial = serialEntries.find(
        (s) => s.serial_number?.toLowerCase() === code.toLowerCase(),
      );

      if (foundSerial) {
        if (!pd_selectedStockIds.includes(foundSerial.id)) {
          pd_setSelectedStockIds((prev) => [...prev, foundSerial.id]);
          toast.success(`Serie añadida: ${foundSerial.serial_number}`);
        } else {
          toast.info("Esta unidad ya ha sido seleccionada");
        }
        return;
      }

      // 2. ¿Es un SKU?
      handleBarcodeScan(code);
    },
    [serialEntries, pd_selectedStockIds, handleBarcodeScan],
  );

  useBarcodeScanner({
    onScan: handleBarcodeScan,
  });

  // --- 3. HANDLERS ---
  const handleAddToCart = (type: "venta" | "alquiler") => {
    if (!product) return;

    if (pd_selectedStockIds.length > 0) {
      pd_selectedStockIds.forEach((id) => {
        addItem(product, type, id, 1, selectedVariantId);
      });
      pd_setSelectedStockIds([]);
    } else {
      const qtyToAdd = product.is_serial ? 1 : purchaseQuantity;
      addItem(
        product,
        type,
        undefined,
        undefined,
        selectedVariantId,
        {
          quantityOverride: qtyToAdd,
        } as any
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

  const pd_modelName = product.modelId
    ? getModelById(product.modelId)?.name
    : "";

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
              <div className="grid gap-6">
                <Card className="shadow-sm border-muted/40">
                  <CardContent className="p-6 space-y-8">
                    {Object.entries(allAttributeOptions).map(
                      ([key, options]) => (
                        <div key={key} className="space-y-4">
                          <div className="flex items-center justify-between border-b border-muted pb-2">
                            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                              <Tag className="w-3 h-3" />
                              {key}
                            </h3>
                            <span className="text-xs font-semibold text-primary px-3 py-1 bg-primary/5 rounded-full ring-1 ring-primary/10">
                              {selectedAttributes[key] || "Selecciona..."}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {options.map((opt) => {
                              const active =
                                selectedAttributes[key] === opt.name;
                              const available = isOptionAvailable(
                                key,
                                opt.name,
                              );

                              return (
                                <button
                                  key={opt.name}
                                  onClick={() =>
                                    handleAttributeSelect(key, opt.name)
                                  }
                                  disabled={!available}
                                  className={cn(
                                    "relative flex items-center justify-center transition-all duration-300 transform active:scale-95",
                                    opt.isColor
                                      ? "h-11 w-11 rounded-full border-2 p-0.5 shadow-sm"
                                      : "px-5 py-2.5 border rounded-xl text-sm font-semibold shadow-sm min-w-12",
                                    active
                                      ? "border-primary ring-4 ring-primary/10 bg-primary/5 shadow-md"
                                      : "border-muted/60 hover:border-primary/40 bg-background text-muted-foreground hover:text-foreground",
                                    !available &&
                                      "opacity-30 cursor-not-allowed grayscale",
                                  )}
                                >
                                  {opt.isColor ? (
                                    <span
                                      className="w-full h-full rounded-full shadow-inner border border-black/5"
                                      style={{
                                        backgroundColor: opt.hex || "#CCCCCC",
                                      }}
                                    />
                                  ) : (
                                    <span>{opt.name}</span>
                                  )}

                                  {active && (
                                    <div
                                      className={cn(
                                        "absolute bg-primary text-primary-foreground rounded-full flex items-center justify-center border-2 border-background shadow-sm",
                                        opt.isColor
                                          ? "-top-1 -right-1 p-0.5"
                                          : "-top-2 -right-2 p-1",
                                      )}
                                    >
                                      <CheckCircle2
                                        className={
                                          opt.isColor
                                            ? "w-2.5 h-2.5"
                                            : "w-3 h-3"
                                        }
                                      />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ),
                    )}

                    {Object.keys(allAttributeOptions).length === 0 && (
                      <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-muted/40">
                        <Box className="w-10 h-10 opacity-20" />
                        <p className="text-sm font-semibold tracking-tight">
                          Este producto base no tiene variaciones adicionales.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* TARJETA DE ESPECIFICACIONES TÉCNICAS */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 px-1">
                    <div className="h-8 w-1.5 bg-primary/80 rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground/80">
                      Ficha Técnica Detallada
                    </h3>
                  </div>
                  <Card className="overflow-hidden border-border/50 shadow-sm transition-all duration-500 hover:shadow-md bg-linear-to-b from-background to-muted/20">
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/40">
                        {/* SKU BASE */}
                        <div className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/30">
                              <Barcode className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground uppercase">
                              SKU Base
                            </span>
                          </div>
                          <span className="text-xs font-black font-mono bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded text-orange-700 dark:text-orange-400 border border-orange-200/50">
                            {product.baseSku}
                          </span>
                        </div>

                        {/* SKU VARIANTE (Si aplica y es distinto al base) */}
                        {selectedVariant && selectedVariant.sku !== product.baseSku && (
                          <div className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                                <ListChecks className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-xs font-bold text-muted-foreground uppercase">
                                SKU Variante
                              </span>
                            </div>
                            <span className="text-xs font-black font-mono bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-blue-700 dark:text-blue-400 border border-blue-200/50">
                              {selectedVariant.sku}
                            </span>
                          </div>
                        )}

                        {/* ATRIBUTOS SELECCIONADOS */}
                        <div className="p-4 bg-muted/10">
                          <span className="text-[10px] font-black uppercase text-muted-foreground block mb-3">
                            Atributos Actuales
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(selectedAttributes).map(
                              ([typeName, valueName]) => (
                                <Badge
                                  key={typeName}
                                  variant="secondary"
                                  className="px-2 py-1 gap-1.5 border-primary/10"
                                >
                                  <span className="text-[9px] uppercase opacity-50">
                                    {typeName}:
                                  </span>
                                  <span className="text-[10px] font-black">
                                    {valueName}
                                  </span>
                                </Badge>
                              ),
                            )}
                            {!Object.keys(selectedAttributes).length && (
                              <span className="text-[11px] text-muted-foreground italic">
                                Sin variaciones seleccionadas
                              </span>
                            )}
                          </div>
                        </div>

                        {/* STOCK Y DISTRIBUCIÓN */}
                        <div className="p-4 grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-muted-foreground block">
                              Stock Local
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                              <span className="text-sm font-black">
                                {availability.local} unidades
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-muted-foreground block">
                              Otras Sedes
                            </span>
                            <div className="flex items-center gap-2">
                              <Truck className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-sm font-bold text-blue-600">
                                {availability.remote} unidades
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>{" "}
              </div>

              {/* Precios */}
              <div className="space-y-4">
                <Card className="shadow-lg border-2 border-primary/5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground px-4 pt-4 tracking-wider">
                    Detalles comerciales
                  </p>
                  <CardContent className="p-4 space-y-6">
                    {/* Sección Venta */}
                    {product.can_sell && selectedVariant?.priceSell && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase text-muted-foreground">Venta</span>
                          <div className="flex items-baseline gap-2">
                             <span className="text-2xl font-black text-primary">
                               {formatCurrency(bestPromoSell?.finalPrice || selectedVariant.priceSell)}
                             </span>
                             {bestPromoSell?.promotion && (
                               <span className="text-sm text-muted-foreground line-through">
                                 {formatCurrency(selectedVariant.priceSell)}
                               </span>
                             )}
                          </div>
                        </div>

                        {!product.is_serial && availability.sale > 0 && (
                          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-xl border border-dashed">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Cantidad Venta</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center font-bold text-xs">{purchaseQuantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => setPurchaseQuantity(Math.min(availability.sale, purchaseQuantity + 1))}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <Button
                          className={cn(
                            "w-full h-12 text-sm font-bold shadow-sm transition-all duration-300",
                            pd_selectedStockIds.length > 0 && "ring-2 ring-primary ring-offset-2 animate-pulse-subtle"
                          )}
                          disabled={availability.sale === 0}
                          onClick={() => handleAddToCart("venta")}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {availability.sale === 0
                            ? availability.local > 0 
                              ? "Disponible solo p/ alquiler" 
                              : "Sin stock para venta"
                            : product.is_serial && pd_selectedStockIds.length > 0
                              ? `Confirmar Venta (${pd_selectedStockIds.length} series)`
                              : `Añadir a Venta (${purchaseQuantity} unidad${purchaseQuantity > 1 ? 'es' : ''})`}
                        </Button>
                      </div>
                    )}

                    {product.can_sell && product.can_rent && <Separator className="bg-primary/5" />}

                    {/* Sección Alquiler */}
                    {product.can_rent && selectedVariant?.priceRent && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase text-muted-foreground">Alquiler</span>
                          <div className="flex items-baseline gap-2">
                             <span className="text-2xl font-black text-violet-600">
                               {formatCurrency(bestPromoRent?.finalPrice || selectedVariant.priceRent)}
                             </span>
                             <span className="text-xs text-muted-foreground">/ {selectedVariant.rentUnit || "día"}</span>
                          </div>
                        </div>

                        {!product.is_serial && availability.rent > 0 && (
                          <div className="flex items-center justify-between p-2 bg-muted/40 rounded-xl border border-dashed">
                             <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Cantidad Alquiler</span>
                             <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg"
                                  onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center font-bold text-xs">{purchaseQuantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg"
                                  onClick={() => setPurchaseQuantity(Math.min(availability.rent, purchaseQuantity + 1))}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                             </div>
                          </div>
                        )}

                        <Button
                          variant="secondary"
                          className={cn(
                            "w-full h-12 text-sm font-bold border-2 transition-all duration-300",
                            pd_selectedStockIds.length > 0 
                              ? "border-violet-500 bg-violet-100 text-violet-800 ring-2 ring-violet-400 ring-offset-2 animate-pulse-subtle" 
                              : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                          )}
                          disabled={availability.rent === 0}
                          onClick={() => handleAddToCart("alquiler")}
                        >
                          <CalendarClock className="w-4 h-4 mr-2" />
                          {availability.rent === 0
                            ? "No disponible para alquiler"
                            : product.is_serial && pd_selectedStockIds.length > 0
                              ? `Confirmar Alquiler (${pd_selectedStockIds.length} series)`
                              : `Añadir a Alquiler (${purchaseQuantity} unidad${purchaseQuantity > 1 ? 'es' : ''})`}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Botón de Cámara Flotante para Móvil */}
                <div className="fixed bottom-24 right-6 z-40 sm:hidden">
                  <Button
                    size="icon"
                    className="w-14 h-14 rounded-full shadow-2xl bg-violet-600 hover:bg-violet-700 text-white border-4 border-white dark:border-zinc-950"
                    onClick={() => setIsScannerModalOpen(true)}
                  >
                    <Camera className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Buscador de Prendas (Solo para productos serializados) */}
            {product.is_serial && (
              <Card className="border-blue-100 bg-blue-50/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Barcode className="w-4 h-4" />
                    <h3 className="font-semibold">
                      Selección de Unidades Específicas
                    </h3>
                  </div>
                  <p className="text-[11px] text-blue-600 leading-tight">
                    Para productos con número de serie, puedes elegir unidades específicas antes de añadir al carrito.
                  </p>

                  <div className="flex items-center justify-between mb-4 bg-muted/40 p-2 rounded-lg border border-dashed">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Unidades a asignar</span>
                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-1 bg-background rounded border p-0.5">
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-5 w-5"
                           onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                         >
                           <Minus className="w-2 h-2" />
                         </Button>
                         <span className="w-4 text-center text-[10px] font-black">{purchaseQuantity}</span>
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-5 w-5"
                           onClick={() => setPurchaseQuantity(purchaseQuantity + 1)}
                         >
                           <Plus className="w-2 h-2" />
                         </Button>
                       </div>
                    </div>
                  </div>

                  <StockAssignmentWidget
                    productId={product.id}
                    variantId={selectedVariantId}
                    quantity={purchaseQuantity}
                    operationType={availability.rent > 0 ? "alquiler" : "venta"}
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
                  <h3 className="font-semibold">
                    Disponibilidad en Sucursales
                  </h3>
                </div>
                <div className="space-y-3">
                  {branchRows.map((row) => (
                    <div
                      key={row.branchId}
                      className="flex items-center justify-between p-2 rounded-lg border bg-background/50"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium flex items-center gap-2">
                          {row.branchName}
                          {row.isLocal && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-4"
                            >
                              Local
                            </Badge>
                          )}
                        </span>
                        {!row.isLocal && row.qty > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            Transf. estimada: {row.transferHours}h
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={row.qty > 0 ? "default" : "outline"}
                        className={cn(
                          row.qty > 0
                            ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                            : "opacity-30",
                        )}
                      >
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

      <ScannerModal
        open={isScannerModalOpen}
        onOpenChange={setIsScannerModalOpen}
        onScan={handleScannerResult}
      />
    </div>
  );
}

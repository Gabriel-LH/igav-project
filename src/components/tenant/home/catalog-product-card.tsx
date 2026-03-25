// src/components/home/catalog-product-card.tsx
import { Badge } from "@/components/badge";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, SaleTag02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { productSchema } from "../../../types/product/type.product";
import { z } from "zod";
import { formatCurrency } from "@/src/utils/currency-format";
import { useBranchStore } from "@/src/store/useBranchStore";
import { useTenantConfigStore, DEFAULT_CONFIG } from "@/src/store/useTenantConfigStore";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import type { ProductVariant } from "@/src/types/product/type.productVariant";
import type { InventoryItem } from "@/src/types/product/type.inventoryItem";
import type { StockLot } from "@/src/types/product/type.stockLote";
import type { Category } from "@/src/types/category/type.category";
import type { AttributeType } from "@/src/types/attributes/type.attribute-type";
import type { AttributeValue } from "@/src/types/attributes/type.attribute-value";
import { useMemo, useEffect } from "react";
import { usePromotionStore } from "@/src/store/usePromotionStore";
import { calculateBestPromotionForProduct } from "@/src/utils/promotion/promotio.engine";
import Autoplay from "embla-carousel-autoplay";
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Truck } from "lucide-react";

interface Props {
  product: z.infer<typeof productSchema>;
  inventoryItems: InventoryItem[];
  stockLots: StockLot[];
  allVariants: ProductVariant[];
  categories: Category[];
  attributeTypes: AttributeType[];
  attributeValues: AttributeValue[];
}

type DisplayAttributeValue = {
  name: string;
  hex?: string;
  isColor: boolean;
};

export function CatalogProductCard({
  product,
  inventoryItems,
  stockLots,
  allVariants,
  categories,
  attributeTypes,
  attributeValues,
}: Props) {
  const currentBranchId = useBranchStore((s) => s.selectedBranchId);
  const { promotions } = usePromotionStore();
  const { config, ensureLoaded } = useTenantConfigStore();

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  // Fallback to DEFAULT_CONFIG if database config is not yet loaded
  const tenantConfig = config || (DEFAULT_CONFIG as any);

  const activePromos = useMemo(() => {
    const now = new Date();
    return promotions.filter((promo) => {
      if (!promo.isActive) return false;
      if (promo.startDate && new Date(promo.startDate) > now) return false;
      if (promo.endDate && new Date(promo.endDate) < now) return false;
      if (promo.branchIds?.length && !promo.branchIds.includes(currentBranchId)) {
        return false;
      }
      if (promo.usageType && promo.usageType !== "automatic") return false;
      return true;
    });
  }, [promotions, currentBranchId]);

  const productVariants = useMemo(
    () => allVariants.filter((variant) => variant.productId === product.id),
    [allVariants, product.id],
  );

  const variantIds = useMemo(
    () => productVariants.map((variant) => String(variant.id)),
    [productVariants],
  );

  const productStock = useMemo(() => {
    if (product.is_serial) {
      return inventoryItems.filter(
        (item) =>
          variantIds.includes(String(item.variantId)) &&
          item.status === "disponible",
      );
    }

    return stockLots.filter(
      (lot) =>
        variantIds.includes(String(lot.variantId)) &&
        lot.status === "disponible" &&
        lot.quantity > 0,
    );
  }, [inventoryItems, stockLots, product.is_serial, variantIds]);

  const localStock = useMemo(
    () => productStock.filter((stock) => stock.branchId === currentBranchId),
    [productStock, currentBranchId],
  );

  const remoteStock = useMemo(
    () => productStock.filter((stock) => stock.branchId !== currentBranchId),
    [productStock, currentBranchId],
  );

  const hasRentalStock = productStock.some((stock) => stock.isForRent);
  const hasSaleStock = productStock.some((stock) => stock.isForSale);
  const hasLocal = localStock.length > 0;
  const hasRemote = remoteStock.length > 0;
  const displayStock = hasLocal ? localStock : remoteStock;

  const variantsToDisplay = useMemo(() => {
    if (displayStock.length === 0) return productVariants;
    const variantIdsInStock = new Set(
      displayStock.map((stock) => String(stock.variantId)),
    );
    return productVariants.filter((variant) =>
      variantIdsInStock.has(String(variant.id)),
    );
  }, [displayStock, productVariants]);

  const priceRent = useMemo(() => {
    const prices = variantsToDisplay
      .map((variant) => variant.priceRent || 0)
      .filter((price) => price > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [variantsToDisplay]);

  const priceSell = useMemo(() => {
    const prices = variantsToDisplay
      .map((variant) => variant.priceSell || 0)
      .filter((price) => price > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [variantsToDisplay]);

  const rentUnit = productVariants[0]?.rentUnit || "unidad";

  const bestPromoRent = useMemo(() => {
    if (!product.can_rent) return null;
    const applicable = activePromos.filter((promo) =>
      promo.appliesTo.includes("alquiler"),
    );
    return calculateBestPromotionForProduct(product, priceRent, applicable);
  }, [activePromos, product, priceRent]);

  const bestPromoSell = useMemo(() => {
    if (!product.can_sell) return null;
    const applicable = activePromos.filter((promo) =>
      promo.appliesTo.includes("venta"),
    );
    return calculateBestPromotionForProduct(product, priceSell, applicable);
  }, [activePromos, product, priceSell]);

  const bestOverallDiscount = useMemo(() => {
    let best = { discount: 0, finalPrice: 0, isRent: false, reason: "" };

    if (bestPromoSell && bestPromoSell.discount > best.discount) {
      best = {
        ...bestPromoSell,
        isRent: false,
        reason: bestPromoSell.reason || "",
      };
    }

    if (bestPromoRent && bestPromoRent.discount > best.discount) {
      best = {
        ...bestPromoRent,
        isRent: true,
        reason: bestPromoRent.reason || "",
      };
    }

    return best.discount > 0 ? best : null;
  }, [bestPromoRent, bestPromoSell]);

  const categoryName = useMemo(
    () =>
      categories.find((category) => category.id === product.categoryId)?.name ||
      "General",
    [categories, product.categoryId],
  );

  const displayAttributes = useMemo(() => {
    const attributeKeys = new Set<string>();

    variantsToDisplay.forEach((variant) => {
      Object.keys(variant.attributes || {}).forEach((key) => attributeKeys.add(key));
    });

    return Array.from(attributeKeys).map((attributeKey) => {
      const normalizedKey = attributeKey.trim().toLowerCase();
      const matchingType = attributeTypes.find(
        (type) =>
          type.name.trim().toLowerCase() === normalizedKey ||
          type.code.trim().toLowerCase() === normalizedKey,
      );
      const resolvedValues = new Map<string, DisplayAttributeValue>();

      variantsToDisplay.forEach((variant) => {
        const matchingVariantKey = Object.keys(variant.attributes || {}).find(
          (candidateKey) =>
            candidateKey.trim().toLowerCase() === normalizedKey,
        );
        const rawValue = matchingVariantKey
          ? variant.attributes?.[matchingVariantKey]
          : undefined;

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
        const dedupeKey = `${resolvedName}|${resolvedHex || ""}|${isColor}`;

        resolvedValues.set(dedupeKey, {
          name: resolvedName,
          hex: resolvedHex,
          isColor,
        });
      });

      return {
        keyName: matchingType?.name || attributeKey,
        values: Array.from(resolvedValues.values()),
      };
    });
  }, [variantsToDisplay, attributeTypes, attributeValues]);

  const days = hasRemote
    ? getEstimatedTransferTime(
        currentBranchId,
        remoteStock[0].branchId,
        tenantConfig,
      )
    : tenantConfig.defaultTransferTime;

  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true }),
  );

  return (
    <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border shadow-lg transition-all duration-300 hover:shadow-2xl">
      <div className="bg-muted relative overflow-hidden rounded-t-2xl group">
        <div className="pointer-events-none absolute top-2 right-2 z-20 flex gap-1">
          {product.can_sell && hasSaleStock && (
            <Badge className="bg-slate-900/80 border-none text-[9px] font-bold text-white backdrop-blur-sm">
              Venta
            </Badge>
          )}
          {product.can_rent && hasRentalStock && (
            <Badge className="bg-amber-100/90 border-amber-200 text-[9px] font-bold text-amber-800 backdrop-blur-sm">
              Alquiler
            </Badge>
          )}
        </div>

        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
          {bestOverallDiscount && (
            <Badge className="w-fit animate-pulse bg-red-500 px-2 text-center text-[10px] font-black uppercase text-white shadow-sm hover:bg-red-600">
              {bestOverallDiscount.reason || "DESCUENTO APLICADO!"} -{" "}
              {bestOverallDiscount.discount}% DSCTO.
            </Badge>
          )}
          {hasLocal ? (
            <Badge className="w-fit bg-emerald-500/90 text-[8px] uppercase text-white">
              En esta sede
            </Badge>
          ) : hasRemote ? (
            <Badge className="w-fit animate-pulse bg-blue-500/90 text-[8px] uppercase text-white">
              Disponible para traslado (Llega en {days}{" "}
              {days === 1 ? "día" : "días"}) <Truck className="h-4 w-4" />
            </Badge>
          ) : (
            <Badge variant="destructive" className="w-fit text-[8px] uppercase">
              Agotado
            </Badge>
          )}
        </div>

        <div className="relative overflow-hidden rounded-xl bg-transparent group">
          <div className="relative w-full bg-transparent">
            <Carousel
              plugins={[plugin.current]}
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
              className="w-full"
            >
              <CarouselContent>
                {product.image.map((imageUrl, index) => (
                  <CarouselItem key={index}>
                    <div className="relative h-[265px] w-full">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="100vw"
                        priority={index === 0}
                        className="object-contain bg-transparent"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>

      <div className="isolate z-50 flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-col gap-1">
          <div className="flex w-full justify-between">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              {product.categoryId ? categoryName : "General"}
            </p>
          </div>
          <h3 className="line-clamp-2 text-base font-bold transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </div>

        <div className="flex-1 space-y-1">
          <div className="space-y-1 border-muted/50 py-2">
            <div className="flex flex-col gap-3">
              {displayAttributes.length > 0 ? (
                displayAttributes.map((attribute, index) => (
                  <div
                    key={`${attribute.keyName}-${index}`}
                    className="flex items-center justify-between"
                  >
                    <span className="text-muted-foreground mr-1 text-[9px] font-bold uppercase">
                      {attribute.keyName} disp:
                    </span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {attribute.values.length > 0 ? (
                        attribute.values.map((value, valueIndex) =>
                          value.isColor ? (
                            <div
                              key={`${value.name}-${valueIndex}`}
                              className="flex items-center gap-1 text-[9px]"
                              title={`${value.name}${value.hex ? ` (${value.hex})` : ""}`}
                            >
                              <span
                                className="h-3 w-3 shrink-0 rounded-full border border-black/10 shadow-sm"
                                style={{
                                  backgroundColor: value.hex || "#CCCCCC",
                                }}
                              />
                              
                            </div>
                          ) : (
                            <span
                              key={`${value.name}-${valueIndex}`}
                              className="line-clamp-1 break-all rounded-[4px] border bg-card px-1.5 py-0.5 text-[9px] font-black text-card-foreground"
                              title={value.name}
                            >
                              {value.name}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="text-[8px] font-bold uppercase text-red-500">
                          Agotado
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[9px] font-bold uppercase">
                    Disponibilidad {hasLocal ? "local" : "en otras sedes"}:
                  </span>
                  <span className="text-[10px] font-medium">Sí</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-0.5">
            {product.can_rent && (
              <div
                className={`flex items-center justify-between text-[13px] ${
                  bestPromoRent && bestPromoRent.discount > 0
                    ? "text-green-600"
                    : ""
                }`}
              >
                <div className="text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  <span>
                    Alquiler{" "}
                    {bestPromoRent && bestPromoRent.discount > 0 && (
                      <span className="ml-1 text-[9px] font-bold text-red-500">
                        (-{formatCurrency(bestPromoRent.discount)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {bestPromoRent && bestPromoRent.discount > 0 && (
                    <span className="text-muted-foreground/60 text-[10px] line-through">
                      {formatCurrency(priceRent)}
                    </span>
                  )}
                  <span className="font-bold">
                    {formatCurrency(
                      bestPromoRent ? bestPromoRent.finalPrice : priceRent,
                    )}{" "}
                    / {rentUnit}
                  </span>
                </div>
              </div>
            )}

            {product.can_sell && (
              <div
                className={`flex items-center justify-between text-[13px] ${
                  bestPromoSell && bestPromoSell.discount > 0
                    ? "text-green-600"
                    : ""
                }`}
              >
                <div className="text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                  <HugeiconsIcon
                    icon={SaleTag02Icon}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  <span>
                    Venta{" "}
                    {bestPromoSell && bestPromoSell.discount > 0 && (
                      <span className="ml-1 text-[9px] font-bold text-red-500">
                        (-{formatCurrency(bestPromoSell.discount)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {bestPromoSell && bestPromoSell.discount > 0 && (
                    <span className="text-muted-foreground/60 text-[10px] line-through">
                      {formatCurrency(priceSell)}
                    </span>
                  )}
                  <span className="font-bold text-primary">
                    {formatCurrency(
                      bestPromoSell ? bestPromoSell.finalPrice : priceSell,
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-2">
          <Link
            href={`/tenant/product-details/${encodeURIComponent(product.id)}`}
            className="w-full"
          >
            <Badge className="w-full cursor-pointer justify-center py-2 hover:opacity-90">
              Ver detalles
            </Badge>
          </Link>
        </div>
      </div>
    </div>
  );
}

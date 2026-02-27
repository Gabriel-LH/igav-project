// src/components/home/catalog-product-card.tsx
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/badge";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, SaleTag02Icon } from "@hugeicons/core-free-icons";
import { DetailsProductViewer } from "./details-product-viewer";
import { productSchema } from "../../types/product/type.product";
import { z } from "zod";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { formatCurrency } from "@/src/utils/currency-format";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useAttributeStore } from "@/src/store/useAttributeStore";
import { useMemo, useEffect } from "react";
import { usePromotionStore } from "@/src/store/usePromotionStore";
import { calculateBestPromotionForProduct } from "@/src/utils/promotion/promotio.engine";
import { PromotionLoaderService } from "@/src/domain/services/promotionLoader.service";
import { ZustandPromotionRepository } from "@/src/infrastructure/stores-adapters/ZustandPromotionRepository";

interface Props {
  product: z.infer<typeof productSchema>;
}

export function CatalogProductCard({ product }: Props) {
  const user = USER_MOCK;
  const currentBranchId = user[0].branchId!;
  const { getSizeById, getColorById, getModelById, getCategoryById } =
    useAttributeStore();

  const { inventoryItems, stockLots } = useInventoryStore();

  const { promotions } = usePromotionStore();

  useEffect(() => {
    const promotionRepo = new ZustandPromotionRepository();
    const promotionLoader = new PromotionLoaderService(promotionRepo);
    promotionLoader.ensurePromotionsLoaded();
  }, []);

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
    if (!product.can_rent) return null;
    const applicable = activePromos.filter((p) =>
      p.appliesTo.includes("alquiler"),
    );
    return calculateBestPromotionForProduct(
      product,
      product.price_rent || 0,
      applicable,
    );
  }, [activePromos, product]);

  const bestPromoSell = useMemo(() => {
    if (!product.can_sell) return null;
    const applicable = activePromos.filter((p) =>
      p.appliesTo.includes("venta"),
    );
    return calculateBestPromotionForProduct(
      product,
      product.price_sell || 0,
      applicable,
    );
  }, [activePromos, product]);

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

  // 1. Obtener candidatos disponibles (Global)
  const productStock = useMemo(() => {
    if (product.is_serial) {
      return inventoryItems.filter(
        (s) =>
          String(s.productId) === String(product.id) &&
          s.status === "disponible",
      );
    } else {
      return stockLots.filter(
        (s) =>
          String(s.productId) === String(product.id) &&
          s.status === "disponible" &&
          s.quantity > 0,
      );
    }
  }, [inventoryItems, stockLots, product.id, product.is_serial]);

  // 2. Stock en esta sede (Entrega inmediata)
  const localStock = useMemo(
    () => productStock.filter((s) => s.branchId === currentBranchId),
    [productStock, currentBranchId],
  );

  // 3. Stock en otras sedes (Traslado)
  const remoteStock = useMemo(
    () => productStock.filter((s) => s.branchId !== currentBranchId),
    [productStock, currentBranchId],
  );

  const hasRentalStock = productStock.some((s) => s.isForRent);
  const hasSaleStock = productStock.some((s) => s.isForSale);

  const hasLocal = localStock.length > 0;
  const hasRemote = remoteStock.length > 0;

  // Colores y tallas (Usamos local si hay, si no remoto)
  const displayStock = hasLocal ? localStock : remoteStock;

  const activeColors = useMemo(() => {
    const map = new Map();
    displayStock.forEach((s) => {
      const color = getColorById(s.colorId);
      if (color) {
        map.set(s.colorId, { name: color.name, hex: color.hex });
      } else {
        // Fallback or legacy matching
        map.set(s.colorId || (s as any).color, {
          name: (s as any).color,
          hex: (s as any).colorHex,
        });
      }
    });
    return Array.from(map.values());
  }, [displayStock, getColorById]);

  const activeSizes = useMemo(
    () =>
      Array.from(new Set(displayStock.map((s) => s.sizeId))).map(
        (id) => getSizeById(id)?.name || id,
      ),
    [displayStock, getSizeById],
  );

  const days = hasRemote
    ? getEstimatedTransferTime(
        currentBranchId,
        remoteStock[0].branchId,
        BUSINESS_RULES_MOCK,
      )
    : BUSINESS_RULES_MOCK.defaultTransferTime;

  return (
    <Card className="group pt-0 pb-1 overflow-hidden transition-all shadow-xl">
      <div className=" bg-muted relative overflow-hidden group">
        <div className="absolute top-2 right-2 flex gap-1 z-20 pointer-events-none">
          {product.can_sell && hasSaleStock && (
            <Badge className="bg-slate-900/80 backdrop-blur-sm font-bold text-white border-none text-[9px]">
              Venta
            </Badge>
          )}
          {product.can_rent && hasRentalStock && (
            <Badge className="bg-amber-100/90 backdrop-blur-sm font-bold text-amber-800 border-amber-200 text-[9px]">
              Alquiler
            </Badge>
          )}
        </div>

        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {bestOverallDiscount && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white border-none text-[10px] uppercase font-black px-2 shadow-sm animate-pulse w-fit  text-center">
              {bestOverallDiscount.reason || "DESCUENTO APLICADO!"}{" - "}
              {bestOverallDiscount.discount}% DSCTO.
            </Badge>
          )}
          {hasLocal ? (
            <Badge className="bg-emerald-500/90 text-white border-none text-[8px] uppercase w-fit">
              En esta sede
            </Badge>
          ) : hasRemote ? (
            <Badge className="bg-blue-500/90 text-white border-none text-[8px] uppercase animate-pulse w-fit">
              Disponible para traslado (Llega en {days}{" "}
              {days === 1 ? "día" : "días"}) 🚚
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[8px] uppercase w-fit">
              Agotado
            </Badge>
          )}
        </div>

        <div className="relative bg-neutral-100 group overflow-hidden rounded-t-xl">
          <div className="relative aspect-square">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              className="object-contain transition-transform duration-700 ease-in-out group-hover:scale-110"
            />
          </div>
        </div>
      </div>

      <CardHeader className="px-4 space-y-1">
        <div className="flex w-full justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            {product.categoryId
              ? getCategoryById(product.categoryId)?.name || "General"
              : "General"}
          </p>
          {product.modelId && (
            <p className="text-[10px] text-slate-500 font-bold italic flex items-center gap-1">
              <span className="text-slate-400">Modelo:</span>
              {getModelById(product.modelId)?.name || product.modelId}
            </p>
          )}
        </div>
        <CardTitle className="text-base line-clamp-1 transition-colors group-hover:text-primary">
          {product.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 space-y-1">
        <div className="space-y-1 border-muted/50 py-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-muted-foreground">
                Colores disponibles {hasLocal ? "locales" : "en otras sedes"}:
              </span>
              <div className="flex gap-1.5">
                {activeColors.length > 0 ? (
                  activeColors.map((color) => (
                    <div
                      key={color.name}
                      className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))
                ) : (
                  <span className="text-[8px] uppercase font-bold text-red-500">
                    Sin stock
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-muted-foreground">
                Tallas disponibles {hasLocal ? "locales" : "en otras sedes"}:
              </span>
              <div className="flex gap-1">
                {activeSizes.length > 0 ? (
                  activeSizes.map((size) => (
                    <span
                      key={size}
                      className="rounded-[4px] border bg-card px-1.5 py-0.5 text-[9px] font-black text-card-foreground"
                    >
                      {size}
                    </span>
                  ))
                ) : (
                  <span className="text-[8px] uppercase italic text-muted-foreground">
                    Agotado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-0.5">
          {product.can_rent && (
            <div
              className={`flex items-center justify-between text-[13px] ${bestPromoRent && bestPromoRent.discount > 0 ? "text-green-600" : ""}`}
            >
              <div className="flex items-center gap-1.5 text-muted-foreground line-clamp-1">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  className="h-3.5 w-3.5 shrink-0"
                />
                <span>
                  Alquiler{" "}
                  {bestPromoRent && bestPromoRent.discount > 0 && (
                    <span className="text-[9px] font-bold text-red-500 ml-1">
                      (-{formatCurrency(bestPromoRent.discount)})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-col items-end">
                {bestPromoRent && bestPromoRent.discount > 0 && (
                  <span className="text-[10px] line-through text-muted-foreground/60">
                    {formatCurrency(product.price_rent || 0)}
                  </span>
                )}
                <span className="font-bold">
                  {formatCurrency(
                    bestPromoRent
                      ? bestPromoRent.finalPrice
                      : product.price_rent || 0,
                  )}{" "}
                  / {product.rent_unit}
                </span>
              </div>
            </div>
          )}

          {product.can_sell && (
            <div
              className={`flex items-center justify-between text-[13px] ${bestPromoSell && bestPromoSell.discount > 0 ? "text-green-600" : ""}`}
            >
              <div className="flex items-center gap-1.5 text-muted-foreground line-clamp-1">
                <HugeiconsIcon
                  icon={SaleTag02Icon}
                  className="h-3.5 w-3.5 shrink-0"
                />
                <span>
                  Venta{" "}
                  {bestPromoSell && bestPromoSell.discount > 0 && (
                    <span className="text-[9px] font-bold text-red-500 ml-1">
                      (-{formatCurrency(bestPromoSell.discount)})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-col items-end">
                {bestPromoSell && bestPromoSell.discount > 0 && (
                  <span className="text-[10px] line-through text-muted-foreground/60">
                    {formatCurrency(product.price_sell || 0)}
                  </span>
                )}
                <span className="font-bold text-primary">
                  {formatCurrency(
                    bestPromoSell
                      ? bestPromoSell.finalPrice
                      : product.price_sell || 0,
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <DetailsProductViewer item={product} />
      </CardFooter>
    </Card>
  );
}

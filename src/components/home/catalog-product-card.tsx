// src/components/home/product-card.tsx
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
import { DetailsReservedViewer } from "./details-reserved-viewer";
import { productSchema } from "../../types/product/type.product";
import { reservationSchema } from "../../types/reservation/type.reservation";
import { z } from "zod";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { STOCK_MOCK } from "@/src/mocks/mock.stock";
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { formatCurrency } from "@/src/utils/currency-format";
import { getReservationsByProductId } from "@/src/utils/get-product-reservation";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { getEstimatedTransferTime } from "@/src/utils/transfer/get-estimated-transfer-time";

interface Props {
  product: z.infer<typeof productSchema>;
}

export function CatalogProductCard({ product }: Props) {
  const user = USER_MOCK;
  const currentBranchId = user[0].branchId;

  // 1. Stock en esta sede (Entrega inmediata)
  const localStock = STOCK_MOCK.filter(
    (s) =>
      s.productId.toString() === product.id.toString() &&
      s.branchId === currentBranchId &&
      s.status === "disponible",
  );

  // 2. Stock en otras sedes (Disponible para traslado)
  const remoteStock = STOCK_MOCK.filter(
    (s) =>
      s.productId.toString() === product.id.toString() &&
      s.branchId !== currentBranchId &&
      s.status === "disponible",
  );

  const productStock = STOCK_MOCK.filter(
    (s) =>
      s.productId.toString() === product.id.toString() &&
      s.status === "disponible", // 👈 Solo lo que realmente se puede usar
  );

  // 2. Determinar disponibilidad REAL basada en el Stock
  // (Suponiendo que añadiste 'isForRent' y 'isForSale' a tu stock)
  const hasRentalStock = productStock.some(
    (s) => s.status === "disponible" && s.isForRent,
  );
  const hasSaleStock = productStock.some(
    (s) => s.status === "disponible" && s.isForSale,
  );

  const hasLocal = localStock.length > 0;
  const hasRemote = remoteStock.length > 0;

  // Colores y tallas (Priorizamos local, pero mostramos global si no hay local)
  const displayStock = hasLocal ? localStock : remoteStock;

  const activeColors = Array.from(
    new Map(
      displayStock.map((s) => [s.color, { name: s.color, hex: s.colorHex }]),
    ).values(),
  );
  const activeSizes = Array.from(new Set(displayStock.map((s) => s.size)));

  // SOLUCIÓN: Solo calculamos si hay stock remoto, si no, ponemos 0 o el default
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
          <>
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
          </>
        </div>

        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {/* Estado de Ubicación */}
          {hasLocal ? (
            <Badge className="bg-emerald-500/90 text-white border-none text-[8px] uppercase">
              En esta sede
            </Badge>
          ) : hasRemote ? (
            <Badge className="bg-blue-500/90 text-white border-none text-[8px] uppercase animate-pulse">
              Disponible para traslado (Llega en {days}{" "}
              {days === 1 ? "día" : "días"}) 🚚
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[8px] uppercase">
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

      <CardHeader className="px-4 space-y-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {product.category}
        </p>
        <CardTitle className="text-base line-clamp-1 transition-colors group-hover:text-primary">
          {product.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pt-0 space-y-1">
        <div className="space-y-1 border-muted/50 py-2">
          <div className="flex flex-col gap-3">
            <>
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
            </>
          </div>
        </div>

        {/* Precios */}
        <div className="mt-2 flex flex-col gap-0.5">
          {product.can_rent && (
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <HugeiconsIcon icon={Calendar03Icon} className="h-3.5 w-3.5" />
                <span>Alquiler</span>
              </div>
              <span className="font-bold">
                {formatCurrency(product.price_rent || 0)} / {product.rent_unit}
              </span>
            </div>
          )}

          {product.can_sell && (
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <HugeiconsIcon icon={SaleTag02Icon} className="h-3.5 w-3.5" />
                <span>Venta</span>
              </div>
              <span className="font-bold text-primary">
                {formatCurrency(product.price_sell || 0)}
              </span>
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

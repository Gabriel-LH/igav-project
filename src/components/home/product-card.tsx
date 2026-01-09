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
import { productSchema } from "../../types/payments/type.product";
import { reservationSchema } from "../../types/payments/type.reservation";
import { z } from "zod";
import { getActiveReservation } from "@/src/utils/filtered-products";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { USER_MOCK } from "@/src/mocks/mock.user";
interface Props {
  product: z.infer<typeof productSchema>;
  reservations: z.infer<typeof reservationSchema>[];
}

export function ProductCard({ product, reservations }: Props) {
  // Filtramos las reservas de este producto específico
const  user  = USER_MOCK; 
  const currentBranchId = user[0].branchId;

  // 2. Filtros de reservas (Sigue igual)
  const myReservations = reservations.filter((r) => r.productId === product.id);
  const activeRes = getActiveReservation(myReservations);
  const isReserved = !!activeRes;

 const activeColors = Array.from(
  new Map(
    product.inventory
      .filter((inv) =>
        inv.locations.some(
          (loc) => loc.branchId === currentBranchId && loc.quantity > 0
        )
      )
      .map((item) => [item.color, { name: item.color, hex: item.colorHex }])
  ).values()
);

// 2. Obtener las TALLAS únicas disponibles en la sucursal actual
const activeSizes = Array.from(
  new Set(
    product.inventory
      .filter((inv) =>
        inv.locations.some(
          (loc) => loc.branchId === currentBranchId && loc.quantity > 0
        )
      )
      .map((inv) => inv.size)
  )
);

// 3. Obtener el Hex del color reservado
// Como el color ya está en el inventario, lo buscamos ahí
const reservedColorHex = product.inventory.find(
  (inv) => inv.color === activeRes?.details.color
)?.colorHex;

  // 5. Cliente (Sigue igual)
  const client = CLIENTS_MOCK.find((c) => c.id === activeRes?.customerId);
  return (
    <Card className="group pt-0 pb-1  overflow-hidden transition-all shadow-xl">
      <div className=" bg-muted relative overflow-hidden group">
        {/* Badges de estado (Venta/Alquiler) */}
        <div className="absolute top-2 right-2 flex gap-1 z-20 pointer-events-none">
          {isReserved ? (
            <Badge className="bg-slate-800/80 backdrop-blur-sm font-bold text-yellow-500 border-none text-[12px]">
              Reservado
            </Badge>
          ) : (
            <>
              {product.can_sell && (
                <Badge className="bg-slate-900/80 backdrop-blur-sm font-bold text-white border-none text-[9px]">
                  Venta
                </Badge>
              )}
              {product.can_rent && (
                <Badge className="bg-amber-100/90 backdrop-blur-sm font-bold text-amber-800 border-amber-200 text-[9px]">
                  Alquiler
                </Badge>
              )}
            </>
          )}
        </div>

        {/* CONTENEDOR CON SCROLL */}
        <div className="relative  bg-neutral-100 group overflow-hidden rounded-t-xl">
          <div className="relative aspect-square">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              className="
          object-contain 
          transition-transform duration-700 ease-in-out
          group-hover:scale-110
          "
            />
          </div>
        </div>

          </div>


      <CardHeader className="p-4 pb-2 space-y-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {product.category}
        </p>
        <CardTitle className="text-base line-clamp-1 transition-colors group-hover:text-primary">
          {product.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        <div className="space-y-2 border-y border-muted/50 py-2">
          {isReserved ? (
            <>
              {/* Colores */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">
                  Color reservado:
                </span>
                <div className="flex gap-1.5">
                  <div
                    key={activeRes?.details.color}
                    className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: reservedColorHex }}
                    title={activeRes?.details.color}
                  />
                </div>
              </div>

              {/* Tallas */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">
                  Talla reservada:
                </span>
                <div className="flex gap-1">
                  <span
                    key={activeRes?.details.size}
                    className="rounded-[4px] border bg-card px-1.5 py-0.5 text-[9px] font-black text-card-foreground"
                  >
                    {activeRes?.details.size}
                  </span>
                </div>
              </div>

               <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">
                  Cliente:
                </span>
                <div className="flex gap-1">
                  <span
                    key={client?.id}
                    className="font-semibold text-xs"
                  >
                    {client?.firstName} {client?.lastName}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Colores */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">
                  Colores disponibles:
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

              {/* Tallas */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">
                  Tallas disponibles:
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
          )}
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
                ${product.price_rent} / {product.rent_unit}
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
                ${product.price_sell}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isReserved ? (
          <DetailsReservedViewer item={product} reservation={activeRes } />
        ) : (
          <DetailsProductViewer item={product} />
        )}
      </CardFooter>
    </Card>
  );
}

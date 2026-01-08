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
import { productSchema } from "./type.product";
import { reservationSchema } from "./type.reservation";
import { z } from "zod";

interface Props {
  product: z.infer<typeof productSchema>;
  reservation?: z.infer<typeof reservationSchema>;
}

export function ProductCard({ product, reservation }: Props) {
  const isReserved = !!reservation;
  const activeColors = product.colors.filter((color) =>
    product.inventory.some((inv) => inv.color === color.name && inv.stock > 0)
  );

  const activeSizes = product.sizes.filter((size) =>
    product.inventory.some((inv) => inv.size === size && inv.stock > 0)
  );

  const reservedColorHex = product.colors.find(
    (c) => c.name === reservation?.details.color
  )?.hex;

  if (isReserved) {
    console.log("Reservado: " + reservation?.productId);
    console.log("Talla " + reservation?.details.size);
    console.log("Color " + reservation?.details.color);
    console.log("Cantidad " + reservation?.details.quantity);
    console.log("Notas " + reservation?.details.notes);
    console.log("Fecha de inicio " + reservation?.startDate);
    console.log("Fecha de fin " + reservation?.endDate);
    console.log("Precio " + reservation?.totalAmount);
  }

  return (
    <Card className="group overflow-hidden transition-all shadow-xl">
      <div className="aspect-video bg-muted relative overflow-hidden group">
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
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide snap-y snap-mandatory touch-pan-y pointer-events-auto">
          <div className="relative w-full h-[150%] snap-start">
            {/* h-[150%] hace que la imagen sea más larga que el contenedor para poder deslizarla */}
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="transition-all duration-500 ease-out group-hover:scale-[1.04] group-hover:-translate-y-1"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </div>

        {/* Overlay que indica que se puede deslizar (solo aparece en hover) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-full text-[8px] text-white flex items-center gap-1">
            <span>Deslizar para ver más</span>
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
                    key={reservation?.details.color}
                    className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: reservedColorHex }}
                    title={reservation?.details.color}
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
                    key={reservation?.details.size}
                    className="rounded-[4px] border bg-card px-1.5 py-0.5 text-[9px] font-black text-card-foreground"
                  >
                    {reservation?.details.size}
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
          <DetailsReservedViewer item={product} />
        ) : (
          <DetailsProductViewer item={product} />
        )}
      </CardFooter>
    </Card>
  );
}

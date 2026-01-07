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
import {
  Calendar03Icon,
  SaleTag02Icon,
} from "@hugeicons/core-free-icons";
import { DetailsProductViewer } from "./details-product-viewer";
import { DetailsReservedViewer } from "./details-reserved-viewer";

export function ProductCard({ product }: { product: any }) {
  return (
    <Card className="group overflow-hidden border-muted-foreground/20 hover:border-primary/50 transition-all">
      {/* Contenedor de Imagen o Placeholder */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          {product.can_sell && (
            <Badge className="bg-slate-900 text-white border-none">Venta</Badge>
          )}
          {product.can_rent && (
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-800 border-amber-200"
            >
              Alquiler
            </Badge>
          )}
        </div>
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              {product.category}
            </p>
            <CardTitle className="text-lg line-clamp-1">
              {product.name}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        {/* Sección de Precios */}
        <div className="flex flex-col gap-1">
          {product.can_rent && (
            <div className="flex items-center gap-2 text-sm">
              <HugeiconsIcon
                icon={Calendar03Icon}
                strokeWidth={2.2}
                className="w-3.5 h-3.5 text-muted-foreground"
              />
              <span className="text-muted-foreground">Alquiler:</span>
              <span className="font-semibold text-foreground">
                ${product.price_rent}{" "}
                <span className="text-[10px] font-normal">
                  / {product.rent_unit}
                </span>
              </span>
            </div>
          )}

          {product.can_sell && (
            <div className="flex items-center gap-2 text-sm">
              <HugeiconsIcon
                icon={SaleTag02Icon}
                strokeWidth={2.2}
                className="w-3.5 h-3.5 text-muted-foreground"
              />
              <span className="text-muted-foreground">Venta:</span>
              <span className="font-bold text-primary text-base">
                ${product.price_sell}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {product.is_reserved ? (
          <DetailsReservedViewer item={product} />
        ) : (
          <DetailsProductViewer item={product} />
        )}
      </CardFooter>
    </Card>
  );
}

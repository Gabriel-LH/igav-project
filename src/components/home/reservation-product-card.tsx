// src/components/home/reservation-product-card.tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/badge";
import Image from "next/image";
import { DetailsReservedViewer } from "./details-reserved-viewer";
import { productSchema } from "../../types/product/type.product";
import { z } from "zod";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { STOCK_MOCK } from "@/src/mocks/mock.stock";
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { formatCurrency } from "@/src/utils/currency-format";

interface Props {
  product: z.infer<typeof productSchema>;
  // Recibimos la reserva específica para que esta Card sea ÚNICA por reserva
  reservation: any;
}

export function ReservationProductCard({ product, reservation }: Props) {
  // 1. Buscamos el item exacto de esta reserva
  const specificItem = MOCK_RESERVATION_ITEM.find(
    (i) =>
      i.reservationId === reservation.id &&
      i.productId === product.id.toString()
  );

  const specificClient = CLIENTS_MOCK.find(
    (c) => c.id === reservation.customerId
  );

  const specificColorHex = STOCK_MOCK.find(
    (s) =>
      s.productId.toString() === product.id.toString() &&
      s.color === specificItem?.color
  )?.colorHex;

  return (
    <Card className="flex  flex-row items-center justify-between p-3 gap-4 hover:shadow-md transition-all border-l-4">
      {/* 1. Miniatura de Imagen */}

      <div className=" hidden md:flex bg-muted border rounded-lg">
        <Image
          src={product.image}
          alt={product.name}
          width={60}
          height={60}
          className="rounded-lg"
        />
      </div>

      {/* 2. Información del Producto y Variante */}
      <div className="flex flex-col ">
        <h4 className="text-sm font-bold truncate">{product.name}</h4>
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-1">
            <div
              className="h-2.5 w-2.5 rounded-full border border-black/10"
              style={{ backgroundColor: specificColorHex }}
            />
            <span className="text-[10px] text-muted-foreground font-medium uppercase">
              {specificItem?.color}
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1.5 font-bold bg-slate-50"
          >
            TALLA {specificItem?.size}
          </Badge>
        </div>
      </div>

      {/* 3. Información del Cliente (Visible en Desktop) */}
      <div className="flex md:flex flex-col border-x md:px-4">
        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter">
          Cliente
        </span>
        <span className="text-xs font-semibold text-primary truncate">
          {specificClient?.firstName} {specificClient?.lastName}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {specificClient?.phone}
        </span>
      </div>

      {/* 4. Estado y Fecha */}
      <div className="hidden lg:flex flex-col">
        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter">
          Estado
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase text-yellow-600">
            {reservation.status}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">
          {new Date(reservation.startDate).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>

       <div className="hidden lg:flex flex-col">
        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter">
          Precio
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase text-yellow-600">
            {formatCurrency(specificItem?.priceAtMoment || 0)}
          </span>
        </div>
        <span>
            
        </span>
      </div>

      {/* 5. Acción Principal */}
      <div>
        <DetailsReservedViewer item={product} reservation={reservation} />
      </div>
    </Card>
  );
}

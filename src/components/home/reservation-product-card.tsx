// src/components/home/reservation-product-card.tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/badge";
import Image from "next/image";
import { DetailsReservedViewer } from "./details-reserved-viewer";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { STOCK_MOCK } from "@/src/mocks/mock.stock";
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { formatCurrency } from "@/src/utils/currency-format";
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { useReservationStore } from "@/src/store/useReservationStore";

interface Props {
  // Recibimos la reserva específica para que esta Card sea ÚNICA por reserva
  reservation: Reservation;
}

export function ReservationProductCard({ reservation }: Props) {

  const { reservationItems } = useReservationStore();

  // 1. Buscamos el item exacto de esta reserva
  const specificItems = reservationItems.filter(
    (i) => i.reservationId === reservation.id
  );
  const specificClient = CLIENTS_MOCK.find(
    (c) => c.id === reservation.customerId
  );

  if (!specificItems.length) {
    return null;
  }

  return (
    <Card className="flex flex-col p-4 gap-4 hover:shadow-md transition-all ">
      {/* CABECERA: Info del Cliente y Estado */}
      <div className="flex justify-between items-start border-b pb-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">
            Cliente
          </span>
          <span className="text-sm font-bold text-primary">
            {specificClient?.firstName} {specificClient?.lastName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {specificClient?.phone}
          </span>
        </div>
        <div className="text-right">
          <Badge className=" bg-accent border border-gray-600 text-green-600  text-[10px] font-black">
            {reservation.status.toUpperCase()}
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-1 font-bold">
            Retiro:{" "}
            {new Date(reservation.startDate).toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* CUERPO: Lista de productos de esta reserva */}
      <div className="space-y-3">
        {specificItems.map((item) => {
          // Buscamos la info del producto (nombre, imagen) para cada ítem
          const productInfo = PRODUCTS_MOCK.find(
            (p) => p.id.toString() === item.productId
          );

          const itemColorHex = STOCK_MOCK.find(
            (s) =>
              s.productId.toString() === item.productId.toString() &&
              s.color === item.color
          )?.colorHex;

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg"
            >
              <Image
                src={productInfo?.image ?? ""}
                alt="Product"
                width={40}
                height={40}
                className="rounded "
              />
              <div className="flex-1">
                <p className="text-xs font-bold">{productInfo?.name}</p>
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    Talla {item.size}
                  </span>
                  <div
                    className="h-2.5 w-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: itemColorHex }}
                  />

                  <span className="md:text-[10px] text-[8px] text-muted-foreground font-medium uppercase">
                    {item.color}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold">
                {formatCurrency(item.priceAtMoment)}
              </span>
            </div>
          );
        })}
      </div>

      {/* FOOTER: Botón de acción */}
      <div className="pt-2">
        {/* Pasamos el primer producto como referencia o ajustamos el viewer para recibir la reserva completa */}
        <DetailsReservedViewer reservation={reservation} />
      </div>
    </Card>
  );
}

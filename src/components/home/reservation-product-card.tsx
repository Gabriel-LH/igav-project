// src/components/home/reservation-product-card.tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/badge";
import Image from "next/image";
import { DetailsReservedViewer } from "./details-reserved-viewer";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { formatCurrency } from "@/src/utils/currency-format";
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import { Reservation } from "@/src/types/reservation/type.reservation";
import { useReservationStore } from "@/src/store/useReservationStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";

interface Props {
  // Recibimos la reserva específica para que esta Card sea ÚNICA por reserva
  reservation: Reservation;
}

export function ReservationProductCard({ reservation }: Props) {
  const { reservationItems } = useReservationStore();
  const { inventoryItems, stockLots } = useInventoryStore();

  // 1. Buscamos el item exacto de esta reserva
  const specificItems = reservationItems.filter(
    (i) => i.reservationId === reservation.id,
  );
  const specificClient = CLIENTS_MOCK.find(
    (c) => c.id === reservation.customerId,
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
        {/* Agrupamos items visualmente */}
        {Object.values(
          specificItems.reduce(
            (acc, item) => {
              const key = `${item.productId}-${item.sizeId}-${item.colorId}`;
              if (!acc[key]) {
                acc[key] = { ...item, quantity: 0 };
              }
              acc[key].quantity += item.quantity;
              return acc;
            },
            {} as Record<string, (typeof specificItems)[0]>,
          ),
        ).map((item) => {
          // Buscamos la info del producto (nombre, imagen) para cada ítem
          const productInfo = PRODUCTS_MOCK.find(
            (p) => p.id.toString() === item.productId,
          );

          const itemColorHex = (
            [...inventoryItems, ...stockLots] as any[]
          ).find(
            (s) =>
              s.productId.toString() === item.productId.toString() &&
              s.colorId === item.colorId,
          )?.colorHex;

          return (
            <div
              key={`${item.id}-grouped`}
              className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg"
            >
              <div className="relative">
                <Image
                  src={productInfo?.image ?? ""}
                  alt="Product"
                  width={40}
                  height={40}
                  className="rounded "
                />
                {item.quantity > 1 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]">
                    {item.quantity}
                  </Badge>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold">{productInfo?.name}</p>
                  <span className="text-xs font-bold">
                    {formatCurrency(item.priceAtMoment * item.quantity)}
                  </span>
                </div>
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    Talla {item.sizeId}
                  </span>
                  <div
                    className="h-2.5 w-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: itemColorHex }}
                  />

                  <span className="md:text-[10px] text-[8px] text-muted-foreground font-medium uppercase">
                    {item.colorId}
                  </span>
                </div>
                {item.quantity > 1 && (
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {formatCurrency(item.priceAtMoment)} c/u
                  </p>
                )}
              </div>
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

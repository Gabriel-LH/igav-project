import { RESERVATIONS_MOCK } from "@/src/mocks/mock.reservation";
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import Image from "next/image";
import { DetailsReservedViewer } from "../details-reserved-viewer";

export function ReservationRowCard({ item }: { item: any }) {
  const product = PRODUCTS_MOCK.find(p => p.id.toString() === item.productId);
  const reservation = RESERVATIONS_MOCK.find(r => r.id === item.reservationId);
  const client = CLIENTS_MOCK.find(c => c.id === reservation?.customerId);

  return (
    <div className="flex items-center gap-4 bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-all">
      {/* Imagen pequeña de referencia */}
      <div className="relative h-16 w-16 shrink-0 bg-muted rounded-md overflow-hidden">
        <Image src={product?.image || ""} fill className="object-cover" alt="ref" />
      </div>

      {/* Info del Producto */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm truncate">{product?.name}</h4>
        <div className="flex gap-2 text-[10px] text-muted-foreground uppercase font-bold">
          <span>Talla: {item.size}</span>
          <span>Color: {item.color}</span>
        </div>
      </div>

      {/* Info del Cliente */}
      <div className="flex-1 hidden md:block border-l pl-4">
        <p className="text-[10px] text-muted-foreground font-bold uppercase">Cliente</p>
        <p className="text-sm font-semibold">{client?.firstName} {client?.lastName}</p>
      </div>

      {/* Fechas y Estado */}
      <div className="flex-1 hidden sm:block border-l pl-4">
        <p className="text-[10px] text-muted-foreground font-bold uppercase">Entrega</p>
        <p className="text-sm">{reservation?.startDate.toLocaleDateString()}</p>
      </div>

    </div>
  );
}
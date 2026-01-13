import { ReservationItem } from "../types/reservation/type.reservationItem";

export const  MOCK_RESERVATION_ITEM: ReservationItem[] = [
       { 
        id: "RES-001-001",
        operationId: 501,
        reservationId: "RES-001",
        size: "M",        // Dato vital para ropa
        productId: "2",
        itemStatus: "en_tienda",
        quantity: 1,
        color: "Negro",   // Dato vital para ropa
        notes: "Ajustar basta 2cm",
        priceAtMoment: 180,
      },
          {
        id: "RES-002-001",
        operationId: 502,
        reservationId: "RES-002",
        size: "L",
        productId: "1",
        itemStatus: "en_tienda",
        quantity: 1,
        color: "Azul Marino",
        notes: "Bordado con logo de la empresa en el pecho.",
        priceAtMoment: 120,
      },
          {
        id: "RES-003-001",
        operationId: 503,
        reservationId: "RES-003",
        size: "M",
        productId: "1",
        itemStatus: "en_tienda",
        quantity: 2,
        color: "Negro",
        notes: "Entrega nocturna programada.",
        priceAtMoment: 100,
      },
];
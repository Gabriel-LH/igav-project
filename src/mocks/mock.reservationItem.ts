import { ReservationItem } from "../types/reservation/type.reservationItem";

export const MOCK_RESERVATION_ITEM: ReservationItem[] = [
  {
    id: "RES-001-001",
    operationId: "op-001",
    reservationId: "RES-001",
    stockId: "STK-005",
    sizeId: "SZ-001", // Dato vital para ropa
    productId: "2",
    itemStatus: "confirmada",
    quantity: 1,
    colorId: "CL-001", // Dato vital para ropa
    notes: "Ajustar basta 2cm",
    priceAtMoment: 180,
    discountAmount: 0,
  },
  {
    id: "RES-002-001",
    operationId: "op-002",
    reservationId: "RES-002",
    stockId: "STK-002",
    sizeId: "SZ-002",
    productId: "1",
    itemStatus: "confirmada",
    quantity: 1,
    colorId: "CL-002",
    notes: "Bordado con logo de la empresa en el pecho.",
    priceAtMoment: 120,
    discountAmount: 0,
  },
  {
    id: "RES-003-001",
    operationId: "op-003",
    reservationId: "RES-003",
    stockId: "STK-003",
    sizeId: "SZ-003",
    productId: "1",
    itemStatus: "confirmada",
    quantity: 2,
    colorId: "CL-003",
    notes: "Entrega nocturna programada.",
    priceAtMoment: 100,
    discountAmount: 0,
  },
];

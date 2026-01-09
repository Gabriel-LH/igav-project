import { Reservation } from "../types/payments/type.reservation";

export const RESERVATIONS_MOCK: Reservation[] = [
  {
    id: "RES-001",
    productId: 4,
    customerId: "cl_001",
    branchId: "branch-001",
    startDate: new Date(2026, 0, 15),
    endDate: new Date(2026, 0, 18),
    hour: "10:00 AM",
    status: "confirmada",
    details: {
      quantity: 1,
      size: "S",        // Dato vital para ropa
      color: "Negro",   // Dato vital para ropa
      notes: "Ajustar basta 2cm",
      priceAtMoment: 180,
    },
    createdAt: new Date(2026, 0, 1),
  },
  {
    id: "RES-002",
    productId: 2,
    customerId: "cl_002",
    branchId: "branch-002",
    startDate: new Date(2026, 0, 12),
    endDate: new Date(2026, 0, 15),
    hour: "10:00 AM",
    status: "pendiente",
    details: {
      size: "L",
      quantity: 1,
      color: "Azul Marino",
      notes: "Bordado con logo de la empresa en el pecho.",
      priceAtMoment: 120,
    },
    createdAt: new Date(2026, 0, 5),
  },
  {
    id: "RES-003",
    productId: 3,
    customerId: "cl_003",
    branchId: "branch-003",
    startDate: new Date(2026, 0, 5),
    endDate: new Date(2026, 0, 7),
    hour: "10:00 AM",
    status: "finalizada",
    details: {
      quantity: 2,
      notes: "Entrega nocturna programada.",
      size: "M",    
      color: "Negro",
      priceAtMoment: 100,
    },
    createdAt: new Date(2025, 11, 28),
  }
];


import { Operation } from "../types/operation/type.operations";

export const OPERATIONS_MOCK: Operation[] = [
  {
    id: 501,
    branchId: "branch-001",
    sellerId: "550e8400-e29b-41d4-a716-446655440000",
    customerId: "cl_001",
    reservationId: "RES-001",
    type: "reserva",
    status: "pendiente",
    paymentStatus: "parcial",
    totalAmount: 500,
    date: new Date(2026, 0, 1),
    createdAt: new Date(2026, 0, 1),
  },
  {
    id: 502,
    branchId: "branch-001",
    sellerId: "550e8400-e29b-41d4-a716-446655440000",
    customerId: "cl_002",
    reservationId: "RES-002",
    type: "alquiler",
    status: "pendiente",
    paymentStatus: "parcial",
    totalAmount: 2000,
    date: new Date(2026, 0, 10),
    createdAt: new Date(2026, 0, 1),
  },
  {
    id: 503,
    branchId: "branch-002",
    sellerId: "550e8400-e29b-41d4-a716-446655440000",
    customerId: "cl_002",
    reservationId: "RES-003",
    type: "alquiler",
    status: "pendiente",
    paymentStatus: "parcial",
    totalAmount: 2000,
    date: new Date(2026, 0, 10),
    createdAt: new Date(2026, 0, 1),
  }
];

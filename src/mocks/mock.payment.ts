import { Payment } from "../types/payments/type.payments";

export const PAYMENTS_MOCK: Payment[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440100",
    operationId: 501,
    branchId: "branch-001",
    receivedById: "550e8400-e29b-41d4-a716-446655440000",
    amount: 180,
    receivedAmount: 200,
    changeAmount: 20,
    method: "transferencia",
    type: "adelanto",
    reference: "TX-99281",
    date: new Date(2026, 0, 1),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440101",
    operationId: 502,
    branchId: "branch-001",
    receivedById: "550e8400-e29b-41d4-a716-446655440000",
    amount: 200,
    method: "efectivo",
    type: "cuota",
    date: new Date(2026, 0, 5),
  },
   {
    id: "550e8400-e29b-41d4-a716-446655440102",
    operationId: 502,
    branchId: "branch-001",
    receivedById: "550e8400-e29b-41d4-a716-446655440000",
    amount: 50,
    method: "efectivo",
    type: "garantia",
    date: new Date(2026, 0, 5),
  }
];

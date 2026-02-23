import { Payment } from "../types/payments/type.payments";

export const PAYMENTS_MOCK: Payment[] = [
  // ===============================
  // CLIENTE 1 – Venta anulada por error de cobro
  // ===============================

  // Pago original (entra dinero)
  {
    id: "p-001",
    operationId: "op-001",
    branchId: "branch-001",
    receivedById: "c1a2b3c4-d5e6-47f8-9abc-1234567890ab",
    amount: 150,
    direction: "in",
    method: "cash",
    status: "posted",
    category: "payment",
    date: new Date(2026, 0, 1),
    notes: "Pago total en efectivo",
  },

  // Movimiento compensatorio (sale dinero)
  {
    id: "p-002",
    operationId: "op-001",
    branchId: "branch-001",
    receivedById: "9f1c2d3e-4b5a-6789-8cde-abcdef123456",
    amount: 150,
    direction: "out",
    method: "cash",
    status: "posted",
    category: "correction",
    originalPaymentId: "p-001",
    date: new Date(2026, 0, 1),
    notes: "Corrección por error de cobro en caja",
  },

  // ===============================
  // CLIENTE 2 – Reembolso con retención
  // ===============================

  // Pago original
  {
    id: "p-003",
    operationId: "op-002",
    branchId: "branch-001",
    receivedById: "9f1c2d3e-4b5a-6789-8cde-abcdef123456",
    amount: 200,
    direction: "in",
    method: "card",
    status: "posted",
    category: "payment",
    date: new Date(2026, 0, 5),
    notes: "Pago con tarjeta",
  },

  // Reembolso parcial (cliente recibe 190)
  {
    id: "p-004",
    operationId: "op-002",
    branchId: "branch-001",
    receivedById: "c1a2b3c4-d5e6-47f8-9abc-1234567890ab",
    amount: 190,
    direction: "out",
    method: "card",
    status: "posted",
    category: "refund",
    originalPaymentId: "p-003",
    date: new Date(2026, 0, 6),
    notes: "Reembolso parcial. Se retienen 10 por gastos operativos",
  },
];

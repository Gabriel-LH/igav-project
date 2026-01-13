import { Guarantee } from "../types/guarantee/type.guarantee"; // opcional, si tienes el tipo inferido

export const MOCK_GUARANTEE: Guarantee[] = [
  {
    id: "g-001",
    operationId: 502,
    branchId: "branch-001",
    type: "efectivo",
    value: 50,
    description: "Depósito en efectivo por alquiler",
    status: "custodia",
    receivedById: "550e8400-e29b-41d4-a716-446655440000",
    createdAt: new Date("2025-01-10T10:15:00Z"),
  },
  {
    id: "g-002",
    operationId: 501,
    branchId: "branch-002",
    type: "dni_fisico",
    value: 0,
    description: "DNI original de Juan Pérez",
    status: "devuelta",
    receivedById: "user-002",
    returnedById: "user-003",
    createdAt: new Date("2025-01-08T09:00:00Z"),
    returnedAt: new Date("2025-01-09T18:30:00Z"),
  },
  {
    id: "g-003",
    operationId: 503,
    branchId: "branch-001",
    type: "objeto_valor",
    value: 120000,
    description: "Reloj marca Rolex modelo Submariner",
    status: "retenida",
    receivedById: "user-001",
    createdAt: new Date("2025-01-05T14:45:00Z"),
  },
];

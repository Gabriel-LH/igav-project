import { Reservation } from "../types/reservation/type.reservation";

export const RESERVATIONS_MOCK: Reservation[] = [
  {
    id: "RES-001",
    customerId: "cl_001",
    branchId: "branch-001",
    startDate: new Date(2026, 0, 15),
    endDate: new Date(2026, 0, 18),
    actualReturnDate: new Date(2026, 0, 18),
    updatedAt: new Date(2026, 0, 18),
    hour: "10:00 AM",
    status: "confirmada",
    createdAt: new Date(2026, 0, 1),
  },
  {
    id: "RES-002",
    customerId: "cl_002",
    branchId: "branch-001",
    updatedAt: new Date(2026, 0, 15),
    startDate: new Date(2026, 0, 12),
    endDate: new Date(2026, 0, 15),
    actualReturnDate: new Date(2026, 0, 15),
    hour: "10:00 AM",
    status: "confirmada",
    createdAt: new Date(2026, 0, 5),
  },
  {
    id: "RES-003",
    customerId: "cl_002",
    branchId: "branch-002",
    updatedAt: new Date(2026, 0, 7),
    startDate: new Date(2026, 0, 5),
    endDate: new Date(2026, 0, 7),
    actualReturnDate: new Date(2026, 0, 7),
    hour: "10:00 AM",
    status: "confirmada",
    createdAt: new Date(2025, 11, 28),
  }
];


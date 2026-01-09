import type { User } from "../types/user/type.user";

export const USER_MOCK: User[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Juan Pérez",
    email: "juan.perez@empresa.com",
    role: "admin",
    branchId: "branch-001",
    status: "active",
  },
  {
    id: "c1a2b3c4-d5e6-47f8-9abc-1234567890ab",
    name: "María López",
    email: "maria.lopez@empresa.com",
    role: "gerente",
    branchId: "branch-002",
    status: "active",
  },
  {
    id: "9f1c2d3e-4b5a-6789-8cde-abcdef123456",
    name: "Carlos Ramírez",
    email: "carlos.ramirez@empresa.com",
    role: "vendedor",
    branchId: "branch-003",
    status: "inactive",
  },
];

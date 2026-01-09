import type { Branch } from "../types/branch/type.branch";

export const BRANCH_MOCKS: Branch[] = [
  {
    id: "branch-001",
    name: "Sucursal Centro",
    city: "Ciudad de México",
    address: "Av. Reforma 123",
    phone: "+52 55 1234 5678",
    email: "centro@empresa.com",
    status: "active",
  },
  {
    id: "branch-002",
    name: "Sucursal Norte",
    city: "Monterrey",
    address: "Av. Universidad 456",
    phone: "+52 81 9876 5432",
    email: "norte@empresa.com",
    status: "active",
  },
  {
    id: "branch-003",
    name: "Sucursal Sur",
    city: "Guadalajara",
    address: "Calz. Independencia 789",
    phone: "+52 33 1122 3344",
    email: "sur@empresa.com",
    status: "inactive",
  },
];


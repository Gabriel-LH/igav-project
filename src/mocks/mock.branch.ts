// data/mockBranches.ts
import { Branch } from "../types/branch/type.branch";
import { BranchConfig } from "../types/branch/type.branchConfig";

export const MOCK_BRANCHES: Branch[] = [
  {
    id: "1",
    tenantId: "tenant-1",
    code: "SUC001",
    name: "Sucursal Centro",
    city: "Lima",
    address: "Av. Central 123, Miraflores",
    phone: "+51 1 234-5678",
    email: "centro@empresa.com",
    timezone: "America/Lima",
    isPrimary: true,
    status: "active",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2024-01-15"),
    createdBy: "admin",
  },
  {
    id: "2",
    tenantId: "tenant-1",
    code: "SUC002",
    name: "Sucursal Norte",
    city: "Lima",
    address: "Av. Universitaria 456, San Martín",
    phone: "+51 1 345-6789",
    email: "norte@empresa.com",
    timezone: "America/Lima",
    isPrimary: false,
    status: "active",
    createdAt: new Date("2023-03-15"),
    updatedAt: new Date("2024-02-01"),
    createdBy: "admin",
  },
  {
    id: "3",
    tenantId: "tenant-1",
    code: "SUC003",
    name: "Sucursal Sur",
    city: "Lima",
    address: "Av. Los Héroes 789, Chorrillos",
    phone: "+51 1 456-7890",
    email: "sur@empresa.com",
    timezone: "America/Lima",
    isPrimary: false,
    status: "inactive",
    createdAt: new Date("2023-06-20"),
    updatedAt: new Date("2024-01-30"),
    createdBy: "admin",
  },
];

// Configuraciones mock para sucursales
export const MOCK_BRANCH_CONFIGS: Record<string, BranchConfig> = {
  "1": {
    branchId: "1",
    openHours: {
      open: "08:00",
      close: "20:00",
    },
    daysInLaundry: 2,
    daysInMaintenance: 7,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2024-01-15"),
  },
  "2": {
    branchId: "2",
    openHours: {
      open: "09:00",
      close: "21:00",
    },
    daysInLaundry: 3,
    daysInMaintenance: 5,
    createdAt: new Date("2023-03-15"),
    updatedAt: new Date("2024-02-01"),
  },
};

// Métricas simplificadas
export const MOCK_BRANCH_METRICS: Record<string, any> = {
  "1": {
    branchId: "1",
    monthSales: 158750.5,
    currentCash: 12500.0,
    todayAttendance: 12,
  },
  "2": {
    branchId: "2",
    monthSales: 98450.75,
    currentCash: 8750.0,
    todayAttendance: 5,
  },
};

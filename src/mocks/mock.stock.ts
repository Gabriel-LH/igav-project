import { Stock } from "../types/product/type.stock"; 

export const STOCK_MOCK: Stock[] = [
  // Stock para el producto 1 (Vestido de Noche)
  {
    id: "STK-001",
    productId: "1",
    branchId: "branch-001",
    size: "S",
    color: "Negro",
    colorHex: "#000000",
    quantity: 2,
    condition: "Nuevo",
    status: "lavanderia",
    updatedAt: new Date()
  },
  {
    id: "STK-002-A",
    productId: "1",
    branchId: "branch-001",
    size: "M",
    color: "Negro",
    colorHex: "#000000",
    quantity: 1,
    condition: "Nuevo",
    status: "disponible",
    updatedAt: new Date()
  },
  {
      id: "STK-002-B",
    productId: "1",
    branchId: "branch-001",
    size: "M",
    color: "Negro",
    colorHex: "#000000",
    quantity: 1,
    condition: "Nuevo",
    status: "disponible",
    updatedAt: new Date()
  },
  {
      id: "STK-002-C",
    productId: "1",
    branchId: "branch-001",
    size: "M",
    color: "Negro",
    colorHex: "#000000",
    quantity: 1,
    condition: "Nuevo",
    status: "disponible",
    updatedAt: new Date()
  },
  {
      id: "STK-002-D",
    productId: "1",
    branchId: "branch-001",
    size: "M",
    color: "Negro",
    colorHex: "#000000",
    quantity: 1,
    condition: "Nuevo",
    status: "disponible",
    updatedAt: new Date()
  },
  {
      id: "STK-002-E",
    productId: "1",
    branchId: "branch-001",
    size: "M",
    color: "Negro",
    colorHex: "#000000",
    quantity: 1,
    condition: "Nuevo",
    status: "disponible",
    updatedAt: new Date()
  },
  {
    id: "STK-003",
    productId: "1",
    branchId: "branch-002",
    size: "M",
    color: "Azul Marino",
    colorHex: "#000080",
    quantity: 6,
    condition: "Usado", // Mira como aquí sí podemos decir que este lote es usado
    status: "mantenimiento", // Y este lote está en limpieza
    updatedAt: new Date()
  },
  
  // Stock para el producto 2 (Tuxedo)
  {
    id: "STK-004",
    productId: "2",
    branchId: "branch-001",
    size: "L",
    color: "Azul Marino",
    colorHex: "#000080",
    quantity: 3,
    condition: "Nuevo",
    status: "disponible",
    updatedAt: new Date()
  },
    {
    id: "STK-005",
    productId: "2",
    branchId: "branch-001",
    size: "M",
    color: "Negro",
    colorHex: "#000000",
    quantity: 4,
    condition: "Nuevo",
    status: "disponible",
    updatedAt: new Date()
  }
];
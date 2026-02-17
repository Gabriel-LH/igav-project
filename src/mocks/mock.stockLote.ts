import { StockLot } from "../types/product/type.stockLote";

export const STOCK_LOTS_MOCK: StockLot[] = [
  {
    id: "LOT-001",
    variantCode: "TUXEDO-SLIM-L-BR001",
    productId: "2",
    branchId: "branch-001",
    status: "disponible",
    size: "L",
    color: "Azul Marino",
    colorHex: "#000080",
    quantity: 3,
    isForRent: false,
    isForSale: true,
    updatedAt: new Date(),
  },
  {
    id: "STK-002",
    variantCode: "TUXEDO-SLIM-M-BR002",
    productId: "2",
    branchId: "branch-001",
    size: "M",
    color: "Negro",
    colorHex: "#000000",
    quantity: 4,
    status: "disponible",
    isForRent: true,
    isForSale: false,
    updatedAt: new Date(),
  },

  //Stock para el producto 3 (Traje Clásico)
  {
    id: "STK-003",
    variantCode: "TRAJE-CLAS-L-BR003",
    productId: "3",
    branchId: "branch-001",
    size: "L",
    color: "Azul Marino",
    colorHex: "#000080",
    quantity: 1,
    status: "disponible",
    isForRent: false,
    isForSale: true,
    updatedAt: new Date(),
  },
  {
    id: "STK-004",
    variantCode: "TRAJE-CLAS-M-BR004",
    productId: "3",
    branchId: "branch-001",
    size: "M",
    color: "Negro",
    colorHex: "#000000",
    quantity: 2,
    status: "disponible",
    isForRent: false,
    isForSale: true,
    updatedAt: new Date(),
  },

  // ...más lotes
];

import { StockLot } from "../types/product/type.stockLote";

export const STOCK_LOTS_MOCK: StockLot[] = [

  //Stock para el producto 3 (Traje Clásico)
  {
    id: "lot-uuid-001",
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
    id: "lot-uuid-002",
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

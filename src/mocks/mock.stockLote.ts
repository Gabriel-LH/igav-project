import { StockLot } from "../types/product/type.stockLote";

export const STOCK_LOTS_MOCK: StockLot[] = [
  //Stock para el producto 3 (Traje Clásico)
  {
    id: "lot-uuid-001",
    variantCode: "TRAJE-CLAS-L-BR003",
    productId: "3",
    branchId: "branch-001",
    sizeId: "SIZE-L",
    colorId: "COL-003",
    quantity: 1,
    status: "disponible",
    isForRent: false,
    isForSale: true,
    updatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: "lot-uuid-002",
    variantCode: "TRAJE-CLAS-M-BR004",
    productId: "3",
    branchId: "branch-001",
    sizeId: "SIZE-M",
    colorId: "COL-001",
    quantity: 2,
    status: "disponible",
    isForRent: false,
    isForSale: true,
    updatedAt: new Date(),
    createdAt: new Date(),
  },

  // ...más lotes
];

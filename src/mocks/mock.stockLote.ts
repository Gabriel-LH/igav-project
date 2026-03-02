import { StockLot } from "../types/product/type.stockLote";

export const STOCK_LOTS_MOCK: StockLot[] = [
  //Stock para el producto 3 (Traje Clásico)
  {
    id: "lot-uuid-001",
    variantId: "var-3",
    productId: "3",
    branchId: "branch-001",
    quantity: 1,
    status: "disponible",
    isForRent: false,
    isForSale: true,
    updatedAt: new Date(),
    createdAt: new Date(),
    tenantId: "tenant-a",
  },
  {
    id: "lot-uuid-002",
    variantId: "var-3-2",
    productId: "3",
    branchId: "branch-001",
    quantity: 2,
    status: "disponible",
    isForRent: false,
    isForSale: true,
    updatedAt: new Date(),
    createdAt: new Date(),
    tenantId: "tenant-a",
  },

  // ...más lotes
];

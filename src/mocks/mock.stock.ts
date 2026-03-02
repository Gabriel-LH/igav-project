// mocks/stock.ts
import { StockLot } from "@/src/types/product/type.stockLote";
import { StockListItem } from "@/src/application/interfaces/stock/StockListItem";

export const STOCK_LOTS_MOCK: StockLot[] = [
  {
    id: "stock-1",
    tenantId: "tenant-a",
    productId: "prod-1",
    variantId: "var-1",
    branchId: "branch-1",
    quantity: 50,
    barcode: "9123456789012", // Mismo de la variante o específico
    expirationDate: undefined,
    lotNumber: "LOT-2024-001",
    isForRent: true,
    isForSale: true,
    status: "disponible",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const STOCK_LIST_MOCK: StockListItem[] = [
  {
    id: "stock-1",
    productName: "iPhone 15 Pro",
    variantName: "Negro / 128GB",
    variantCode: "IPH-15-PRO-NEG-128-01",
    barcode: "9123456789012",
    branchName: "Sucursal Central",
    quantity: 50,
    status: "disponible",
    isForRent: true,
    isForSale: true,
    lotNumber: "LOT-2024-001",
  },
];

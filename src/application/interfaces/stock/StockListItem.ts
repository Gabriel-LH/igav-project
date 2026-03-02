// Item en la tabla de stock existente
export interface StockListItem {
  id: string;
  productName: string;
  variantName: string;
  variantCode: string;
  barcode: string;
  branchName: string;
  quantity: number;
  status: string;
  isForRent: boolean;
  isForSale: boolean;
  expirationDate?: Date;
  lotNumber?: string;
}

export interface BaseOperation {
  id: string;
  stockId: string;
  productId: string;
  sku: string;
  productName: string;
  operationId: string;
  size: string;
  quantity: number;
  color: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  branchId: string;
  createdAt: Date;
  notes?: string;
}
export interface BaseOperation {
  id: string;
  operationId: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}


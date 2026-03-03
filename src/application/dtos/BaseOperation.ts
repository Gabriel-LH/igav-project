export interface BaseOperation {
  id: string;
  operationId: string;
  tenantId?: string;
  customerId: string;
  sellerId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}


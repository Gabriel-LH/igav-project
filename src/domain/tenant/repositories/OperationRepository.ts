import { Operation } from "../../../types/operation/type.operations";

export interface OperationRepository {
  addOperation(operation: Operation): Promise<void>;
  getOperationById(id: string): Promise<Operation | null>;
  getOperationsByTenant(tenantId: string): Promise<Operation[]>;
  updateOperationStatus(id: string, status: string): Promise<void>;
  getTodayCount(tenantId: string, type: string): Promise<number>;
  getLastSequence(tenantId: string, type: string): Promise<number>;
  addDiscounts(discounts: any[]): Promise<void>;
}

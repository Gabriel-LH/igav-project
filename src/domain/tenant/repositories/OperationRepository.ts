import { Operation } from "../../../types/operation/type.operations";

export interface OperationRepository {
  addOperation(operation: Operation): Promise<void>;
  getOperationById(id: string): Promise<Operation | null>;
  getOperations(): Promise<Operation[]>;
  updateOperationStatus(id: string, status: string): Promise<void>;
}

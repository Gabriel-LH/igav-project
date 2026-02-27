import { Operation } from "../../types/operation/type.operations";

export interface OperationRepository {
  addOperation(operation: Operation): void;
  getOperationById(id: string): Operation | null;
  getOperations(): Operation[];
  updateOperationStatus(id: string, status: string): void;
}

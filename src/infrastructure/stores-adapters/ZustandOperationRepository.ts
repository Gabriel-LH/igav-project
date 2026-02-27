import { OperationRepository } from "../../domain/repositories/OperationRepository";
import { Operation } from "../../types/operation/type.operations";
import { useOperationStore } from "../../store/useOperationStore";

export class ZustandOperationRepository implements OperationRepository {
  addOperation(operation: Operation): void {
    useOperationStore.getState().addOperation(operation);
  }

  getOperationById(id: string): Operation | null {
    return (
      useOperationStore.getState().operations.find((o) => o.id === id) || null
    );
  }

  getOperations(): Operation[] {
    return useOperationStore.getState().operations;
  }

  updateOperationStatus(id: string, status: string): void {
    useOperationStore.getState().updateOperation(id, { status: status as any });
  }
}

import { OperationRepository } from "../../../domain/tenant/repositories/OperationRepository";
import { Operation } from "../../../types/operation/type.operations";
import { useOperationStore } from "../../../store/useOperationStore";

export class ZustandOperationRepository implements OperationRepository {
  async addOperation(operation: Operation): Promise<void> {
    useOperationStore.getState().addOperation(operation);
  }

  async getOperationById(id: string): Promise<Operation | null> {
    return (
      useOperationStore.getState().operations.find((o) => o.id === id) || null
    );
  }

  async getOperations(): Promise<Operation[]> {
    return useOperationStore.getState().operations;
  }

  async getOperationsByTenant(tenantId: string): Promise<Operation[]> {
    return useOperationStore
      .getState()
      .operations.filter((o) => o.tenantId === tenantId);
  }

  async updateOperationStatus(id: string, status: string): Promise<void> {
    useOperationStore
      .getState()
      .updateOperation(id, { status: status as Operation["status"] });
  }
}

import { create } from "zustand";
import { Operation } from "../types/operation/type.operations";
import { OperationUpdate } from "../types/operation/type.operationUpdate";
import { OPERATIONS_MOCK } from "../mocks/mock.operation";

interface OperationStore {
  operations: Operation[];
  addOperation: (operation: Operation) => void;
  getOperationById: (id: string) => Operation | undefined;
  updateOperation: (id: string, patch: OperationUpdate) => void;
}

export const useOperationStore = create<OperationStore>((set, get) => ({
  operations: OPERATIONS_MOCK,

  addOperation: (operation: Operation) =>
    set((state) => ({ operations: [...state.operations, operation] })),

  getOperationById: (id: string) => get().operations.find((op) => op.id === id),

  updateOperation: (id, patch) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id ? { ...op, ...patch } : op,
      ),
    })),
}));

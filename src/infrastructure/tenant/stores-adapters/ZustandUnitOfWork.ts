import { IUnitOfWork } from "../../../domain/tenant/repositories/IUnitOfWork";

export class ZustandUnitOfWork implements IUnitOfWork {
  async execute<T>(operation: () => Promise<T> | T): Promise<T> {
    // In Zustand, state updates are generally synchronous, but if an
    // error occurs during the operation, we could theoretically attempt
    // to rollback if we snapshotted the state. For now, executing it directly.
    // Real UoW implementation would hook into the DB transaction here.
    return await operation();
  }
}

import { IUnitOfWork } from "@/src/domain/tenant/repositories/IUnitOfWork";

export class PrismaUnitOfWork implements IUnitOfWork {
  // Normally Prisma $transaction is used here, but because we need to inject the
  // TransactionClient down to the repositories, we handle the $transaction at the
  // Server Action layer and inject `tx` into a newly created Factory.
  // This UoW just executes the work immediately, as it's already running within
  // the Prisma $transaction wrapper at the caller level.
  async execute<T>(work: () => Promise<T>): Promise<T> {
    return await work();
  }
}

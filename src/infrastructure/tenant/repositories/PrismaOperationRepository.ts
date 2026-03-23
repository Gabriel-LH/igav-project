import { OperationRepository } from "@/src/domain/tenant/repositories/OperationRepository";
import { Operation } from "@/src/types/operation/type.operations";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaOperationRepository implements OperationRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addOperation(operation: Operation): Promise<void> {
    await this.prisma.operation.create({
      data: {
        id: operation.id,
        referenceCode: operation.referenceCode,
        type: operation.type as any,
        status: operation.status as any,
        paymentStatus: operation.paymentStatus as any,
        subtotal: operation.subtotal || 0,
        discountAmount: operation.discountAmount || 0,
        totalAmount: operation.totalAmount,
        date: operation.date,
        createdAt: operation.createdAt,
        tenantId: operation.tenantId,
        branchId: operation.branchId,
        sellerId: operation.sellerId,
        customerId: operation.customerId || null,
      },
    });
  }

  async getOperationById(id: string): Promise<Operation | null> {
    const op = await this.prisma.operation.findUnique({
      where: { id },
    });
    if (!op) return null;
    return {
      ...op,
      type: op.type as any,
      status: op.status as any,
      paymentStatus: op.paymentStatus as any,
      customerMode: op.customerId ? "registered" : "general", // Approximate reconstruct
    } as Operation;
  }

  async getOperations(): Promise<Operation[]> {
    // Usually this requires tenantId, but the interface doesn't ask for it.
    // For now we just return an empty array if not strictly needed in the backend sequence.
    // In CreateOperationUseCase, it's used to calculate the sequence for the day.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const ops = await this.prisma.operation.findMany({
      where: {
        date: { gte: startOfDay },
      },
    });

    return ops.map(
      (op) =>
        ({
          ...op,
          type: op.type as any,
          status: op.status as any,
          paymentStatus: op.paymentStatus as any,
        }) as Operation,
    );
  }

  async updateOperationStatus(id: string, status: string): Promise<void> {
    await this.prisma.operation.update({
      where: { id },
      data: { status: status as any },
    });
  }
}

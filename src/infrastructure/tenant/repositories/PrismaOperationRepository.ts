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
        type: operation.type as Operation["type"],
        status: operation.status as Operation["status"],
        paymentStatus: operation.paymentStatus as Operation["paymentStatus"],
        subtotal: operation.subtotal || 0,
        discountAmount: operation.discountAmount || 0,
        totalAmount: operation.totalAmount,
        date: operation.date,
        createdAt: operation.createdAt,
        policySnapshot: operation.policySnapshot as Prisma.InputJsonValue,
        configSnapshot: operation.configSnapshot as Prisma.InputJsonValue,
        policyVersion: operation.policyVersion ?? null,
        configVersion: operation.configVersion ?? null,
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
      type: op.type as Operation["type"],
      status: op.status as Operation["status"],
      paymentStatus: op.paymentStatus as Operation["paymentStatus"],
      customerMode: op.customerId ? "registered" : "general", // Approximate reconstruct
      policySnapshot: op.policySnapshot ?? undefined,
      configSnapshot: op.configSnapshot ?? undefined,
      policyVersion: op.policyVersion ?? undefined,
      configVersion: op.configVersion ?? undefined,
    } as Operation;
  }

  async getOperationsByTenant(tenantId: string): Promise<Operation[]> {
    const ops = await this.prisma.operation.findMany({
      where: { tenantId },
    });

    return ops.map(
      (op) =>
        ({
          ...op,
          type: op.type as Operation["type"],
          status: op.status as Operation["status"],
          paymentStatus: op.paymentStatus as Operation["paymentStatus"],
          policySnapshot: op.policySnapshot ?? undefined,
          configSnapshot: op.configSnapshot ?? undefined,
          policyVersion: op.policyVersion ?? undefined,
          configVersion: op.configVersion ?? undefined,
        }) as Operation,
    );
  }

  async getOperations(): Promise<Operation[]> {
    // Keep this for daily sequence calculation (POS)
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
          type: op.type as Operation["type"],
          status: op.status as Operation["status"],
          paymentStatus: op.paymentStatus as Operation["paymentStatus"],
          policySnapshot: op.policySnapshot ?? undefined,
          configSnapshot: op.configSnapshot ?? undefined,
          policyVersion: op.policyVersion ?? undefined,
          configVersion: op.configVersion ?? undefined,
        }) as Operation,
    );
  }

  async updateOperationStatus(id: string, status: string): Promise<void> {
    await this.prisma.operation.update({
      where: { id },
      data: { status: status as Operation["status"] },
    });
  }
}

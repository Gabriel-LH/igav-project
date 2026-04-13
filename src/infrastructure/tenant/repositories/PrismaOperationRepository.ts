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
        customerMode: operation.customerMode,
        status: operation.status as Operation["status"],
        paymentStatus: operation.paymentStatus as Operation["paymentStatus"],
        subtotal: operation.subtotal || 0,
        discountAmount: operation.discountAmount || 0,
        taxAmount: operation.taxAmount ?? null,
        taxRate: operation.taxRate ?? null,
        roundingAmount: operation.roundingAmount ?? null,
        totalBeforeRounding: operation.totalBeforeRounding ?? null,
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
      customerMode: op.customerMode as Operation["customerMode"],
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
          customerMode: op.customerMode as Operation["customerMode"],
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
          customerMode: op.customerMode as Operation["customerMode"],
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

  async getTodayCount(tenantId: string, type: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return await this.prisma.operation.count({
      where: {
        tenantId,
        type: type as any,
        date: { gte: startOfDay },
      },
    });
  }

  async getLastSequence(tenantId: string, type: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const lastOp = await this.prisma.operation.findFirst({
      where: {
        tenantId,
        type: type as any,
        date: { gte: startOfDay },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!lastOp) return 0;
    const parts = lastOp.referenceCode.split("-");
    const lastPart = parts[parts.length - 1];
    return parseInt(lastPart, 10) || 0;
  }

  async addDiscounts(discounts: any[]): Promise<void> {
    if (discounts.length === 0) return;

    // Verificación defensiva: a veces los modelos recién agregados no se reflejan correctamente en el cliente de transacciones // hasta que se reinicia por completo o si la generación tiene peculiaridades con rutas personalizadas.
    if ((this.prisma as any).discountApplied) {
      await (this.prisma as any).discountApplied.createMany({
        data: discounts,
      });
    } else {
      console.warn(
        "Prisma warning: discountApplied model not found on client. Discounts will not be persisted.",
      );
      // Si llegamos aquí, algo falla con la generación/sincronización.
      // Lo registramos, pero dejamos que la transacción continúe para evitar bloquear el TPV.
    }
  }
}

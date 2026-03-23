import { PaymentRepository } from "@/src/domain/tenant/repositories/PaymentRepository";
import { Payment } from "@/src/types/payments/type.payments";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addPayment(payment: Payment): Promise<void> {
    await this.prisma.payment.create({
      data: {
        id: payment.id,
        amount: payment.amount,
        direction: payment.direction as any,
        status: payment.status as any,
        category: payment.category as any,
        date: payment.date,
        createdAt: payment.createdAt,
        // updatedAt: payment.updatedAt, // Doesn't exist in schema
        // amountRefunded: payment.amountRefunded || 0, // Doesn't exist in schema
        notes: payment.notes || "",
        reference: payment.referenceSource || "none", // referenceSource -> reference
        originalPaymentId: payment.referenceSourceId || null, // referenceSourceId -> originalPaymentId

        tenantId: payment.tenantId || "",
        operationId: payment.operationId || "",
        branchId: payment.branchId || "",
        receivedById: payment.receivedById || "",
        paymentMethodId: payment.paymentMethodId || "",
        cashSessionId: payment.cashSessionId || null,
      },
    });
  }

  async getPaymentsByOperationId(operationId: string): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: { operationId },
    });

    return payments.map((p) => ({
      ...p,
      direction: p.direction as any,
      status: p.status as any,
      category: p.category as any,
      referenceSource: p.referenceSource as any,
    })) as Payment[];
  }
}

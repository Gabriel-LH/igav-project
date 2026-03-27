import { PaymentRepository } from "@/src/domain/tenant/repositories/PaymentRepository";
import { Payment } from "@/src/types/payments/type.payments";
import {
  PaymentCategory,
  PaymentDirection,
  PaymentStatusLog,
  Prisma,
  PrismaClient,
} from "@/prisma/generated/client";

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addPayment(payment: Payment): Promise<void> {
    const activeCashSession =
      payment.cashSessionId ||
      !payment.tenantId ||
      !payment.branchId
        ? null
        : await this.prisma.cashSession.findFirst({
            where: {
              tenantId: payment.tenantId,
              branchId: payment.branchId,
              status: "open",
            },
            select: {
              id: true,
            },
            orderBy: {
              openedAt: "desc",
            },
          });

    await this.prisma.payment.create({
      data: {
        id: payment.id,
        amount: payment.amount,
        direction: payment.direction as PaymentDirection,
        status: payment.status as PaymentStatusLog,
        category: payment.category as PaymentCategory,
        date: payment.date,
        createdAt: payment.createdAt,
        notes: payment.notes || "",
        reference: payment.reference || null,
        originalPaymentId: payment.originalPaymentId || null,

        tenantId: payment.tenantId || "",
        operationId: payment.operationId || "",
        branchId: payment.branchId || "",
        receivedById: payment.receivedById || "",
        paymentMethodId: payment.paymentMethodId || "",
        cashSessionId: payment.cashSessionId || activeCashSession?.id || null,
      },
    });
  }

  async getPaymentsByOperationId(operationId: string): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: { operationId },
    });

    return payments.map((p) => ({
      ...p,
      direction: p.direction,
      status: p.status,
      category: p.category,
    })) as Payment[];
  }

  async getPaymentsByTenant(tenantId: string): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: { tenantId },
    });

    return payments.map((p) => ({
      ...p,
      direction: p.direction,
      status: p.status,
      category: p.category,
    })) as Payment[];
  }
}

import { SaleReversalRepository } from "@/src/domain/tenant/repositories/SaleReversalRepository";
import { SaleReversal } from "@/src/types/sales/type.saleReversal";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaSaleReversalRepository implements SaleReversalRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addReversal(reversal: SaleReversal): Promise<void> {
    await this.prisma.saleReversal.create({
      data: {
        id: reversal.id,
        tenantId: reversal.tenantId,
        saleId: reversal.saleId,
        type: reversal.type as "annulment" | "return",
        reason: reversal.reason,
        totalRefunded: reversal.totalRefunded,
        createdBy: reversal.createdBy,
        createdAt: reversal.createdAt,
        items: {
          create: reversal.items.map((item) => ({
            saleItemId: item.saleItemId,
            tenantId: reversal.tenantId,
            condition: item.condition as "perfecto" | "dañado" | "manchado",
            restockingFee: item.restockingFee,
            refundedAmount: item.refundedAmount,
          })),
        },
      },
    });
  }
}

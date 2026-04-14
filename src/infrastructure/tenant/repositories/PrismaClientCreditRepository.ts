import { ClientCreditRepository } from "@/src/domain/tenant/repositories/ClientCreditRepository";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaClientCreditRepository implements ClientCreditRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addCredit(
    customerId: string,
    amount: number,
    reason: string,
    referenceId?: string,
  ): Promise<void> {
    // We assume the caller provides a valid customer ID
    // Find the tenantId from the customer
    const customer = await this.prisma.client.findUnique({
      where: { id: customerId },
      select: { tenantId: true },
    });

    if (!customer) throw new Error("Client not found for credit addition");

    await this.prisma.clientCreditLedger.create({
      data: {
        amount,
        direction: "credit",
        status: "confirmed",
        reason: reason as any,
        operationId: referenceId || null,
        clientId: customerId,
        tenantId: customer.tenantId,
      },
    });

    await this.prisma.client.update({
      where: { id: customerId },
      data: {
        walletBalance: {
          increment: amount,
        },
      },
    });
  }

  async useCredit(
    customerId: string,
    amount: number,
    reason: string,
    referenceId?: string,
  ): Promise<void> {
    const customer = await this.prisma.client.findUnique({
      where: { id: customerId },
      select: { tenantId: true },
    });

    if (!customer) throw new Error("Client not found for credit deduction");

    // Crear entrada en el ledger con dirección "debit"
    await this.prisma.clientCreditLedger.create({
      data: {
        amount,
        direction: "debit",
        status: "confirmed",
        reason: reason as any,
        operationId: referenceId || null,
        clientId: customerId,
        tenantId: customer.tenantId,
      },
    });

    // Descontar del balance del cliente
    await this.prisma.client.update({
      where: { id: customerId },
      data: {
        walletBalance: {
          decrement: amount,
        },
      },
    });
  }
}

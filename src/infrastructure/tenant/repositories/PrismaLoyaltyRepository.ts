import { LoyaltyRepository } from "@/src/domain/tenant/repositories/LoyaltyRepository";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaLoyaltyRepository implements LoyaltyRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addPoints(
    clientId: string,
    points: number,
    type:
      | "earned_purchase"
      | "redeemed"
      | "expired"
      | "manual_adjustment"
      | "bonus_referral",
    operationId?: string,
    description?: string,
  ): Promise<void> {
    const customer = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { tenantId: true },
    });

    if (!customer) throw new Error("Client not found for loyalty points");

    await this.prisma.clientLoyaltyLedger.create({
      data: {
        tenantId: customer.tenantId,
        clientId,
        amount: points,
        direction: type === "redeemed" || type === "expired" ? "debit" : "credit",
        status: "confirmed",
        type: type as any,
        operationId: operationId || null,
        description,
        createdAt: new Date(),
      },
    });

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        loyaltyPoints: {
          increment: type === "redeemed" || type === "expired" ? -Math.abs(points) : Math.abs(points),
        },
      },
    });
  }
}

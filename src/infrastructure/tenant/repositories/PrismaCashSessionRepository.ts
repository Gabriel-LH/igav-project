import { PrismaClient, Prisma } from "@/prisma/generated/client";
import { CashSession } from "@/src/types/cash/type.cash";

export class PrismaCashSessionRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

  async getSessionsByTenant(tenantId: string): Promise<CashSession[]> {
    const sessions = await this.prisma.cashSession.findMany({
      where: { tenantId },
      orderBy: { openedAt: "desc" },
    });

    return sessions as unknown as CashSession[];
  }
}

import { PrismaClient, Prisma } from "@/prisma/generated/client";
import { CashSession } from "@/src/types/cash/type.cash";
import { CashSessionRepository } from "../../domain/tenant/repositories/CashSessionRepository";

export class PrismaCashSessionRepository implements CashSessionRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

  async getSessionsByTenant(tenantId: string): Promise<CashSession[]> {
    const sessions = await this.prisma.cashSession.findMany({
      where: { tenantId },
      orderBy: { openedAt: "desc" },
    });

    return sessions as unknown as CashSession[];
  }

  async findActiveSession(tenantId: string, branchId: string): Promise<CashSession | null> {
    const session = await this.prisma.cashSession.findFirst({
      where: {
        tenantId,
        branchId,
        status: "open",
      },
    });

    return session as unknown as CashSession | null;
  }
}

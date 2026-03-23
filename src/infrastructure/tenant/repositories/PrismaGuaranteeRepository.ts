import { GuaranteeRepository } from "@/src/domain/tenant/repositories/GuaranteeRepository";
import { Guarantee } from "@/src/types/guarantee/type.guarantee";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaGuaranteeRepository implements GuaranteeRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addGuarantee(guarantee: Guarantee): Promise<void> {
    await this.prisma.guarantee.create({
      data: {
        id: guarantee.id,
        tenantId: guarantee.tenantId,
        operationId: guarantee.operationId,
        branchId: guarantee.branchId,
        type: guarantee.type as any,
        value: String(guarantee.value),
        description: guarantee.description,
        status: guarantee.status as any,
        receivedById: guarantee.receivedById,
        returnedById: guarantee.returnedById || null,
        createdAt: guarantee.createdAt,
        returnedAt: guarantee.returnedAt || null,
      },
    });
  }

  async updateGuaranteeStatus(id: string, status: string): Promise<void> {
    await this.prisma.guarantee.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async updateGuarantee(id: string, data: Partial<Guarantee>): Promise<void> {
    await this.prisma.guarantee.update({
      where: { id },
      data: {
        ...data,
      } as any,
    });
  }

  async releaseGuarantee(id: string): Promise<void> {
    await this.prisma.guarantee.update({
      where: { id },
      data: {
        status: "liberada",
        returnedAt: new Date(),
      },
    });
  }
}

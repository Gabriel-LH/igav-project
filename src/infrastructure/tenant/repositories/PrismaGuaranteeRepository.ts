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

  async getGuarantees(tenantId?: string): Promise<Guarantee[]> {
    const guarantees = await this.prisma.guarantee.findMany({
      where: tenantId ? { tenantId } : undefined,
    });
    return guarantees as unknown as Guarantee[];
  }

  async getGuaranteeById(id: string): Promise<Guarantee | undefined> {
    const guarantee = await this.prisma.guarantee.findUnique({
      where: { id },
    });
    return guarantee as Guarantee | undefined;
  }

  async getGuaranteeByOperationId(operationId: string): Promise<Guarantee | undefined> {
    const guarantee = await this.prisma.guarantee.findFirst({
      where: { operationId },
      orderBy: { createdAt: "desc" },
    });
    return guarantee as Guarantee | undefined;
  }

  async findGuaranteeForRental(input: {
    guaranteeId?: string;
    operationId: string;
    rentalId?: string;
  }): Promise<Guarantee | undefined> {
    const orConditions: Prisma.GuaranteeWhereInput[] = [
      { operationId: input.operationId },
    ];

    if (input.guaranteeId) {
      orConditions.unshift({ id: input.guaranteeId });
    }

    if (input.rentalId) {
      orConditions.push({
        description: {
          contains: input.rentalId,
        },
      });
    }

    const guarantee = await this.prisma.guarantee.findFirst({
      where: {
        OR: orConditions,
      },
      orderBy: { createdAt: "desc" },
    });

    return guarantee as Guarantee | undefined;
  }
}

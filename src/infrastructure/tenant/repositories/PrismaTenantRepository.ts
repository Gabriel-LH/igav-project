import { TenantRepository } from "@/src/domain/tenant/repositories/TenantRepository";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaTenantRepository implements TenantRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  getTenantIdByTransaction(dto: { tenantId?: unknown }): string {
    if (!dto.tenantId || typeof dto.tenantId !== "string") {
      throw new Error("tenantId is required for tenant transactions");
    }

    return dto.tenantId;
  }
}

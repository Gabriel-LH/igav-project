import { BranchRepository } from "@/src/domain/tenant/repositories/BranchRepository";
import { Branch } from "@/src/types/branch/type.branch";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaBranchRepository implements BranchRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async getBranchById(tenantId: string, id: string): Promise<Branch | null> {
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenantId },
    });
    return (branch as unknown as Branch) || null;
  }

  async getBranchesByTenant(tenantId: string): Promise<Branch[]> {
    const branches = await this.prisma.branch.findMany({
      where: { tenantId, status: "active" },
    });
    return branches as unknown as Branch[];
  }

  async createBranch(tenantId: string, branch: Partial<Branch>): Promise<Branch> {
    const newBranch = await this.prisma.branch.create({
      data: {
        ...branch,
        tenantId,
      } as any,
    });
    return newBranch as unknown as Branch;
  }

  async updateBranch(tenantId: string, id: string, branch: Partial<Branch>): Promise<Branch> {
    await this.prisma.branch.updateMany({
      where: { id, tenantId },
      data: branch as any,
    });
    
    const updated = await this.prisma.branch.findUnique({
      where: { id },
    });
    
    if (!updated) throw new Error("Branch not found after update");
    return updated as unknown as Branch;
  }
}

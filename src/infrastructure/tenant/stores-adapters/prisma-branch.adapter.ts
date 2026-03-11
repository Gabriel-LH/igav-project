import { BranchRepository } from "@/src/domain/tenant/repositories/BranchRepository";
import { Branch } from "@/src/types/branch/type.branch";
import prisma from "@/src/lib/prisma";

export class PrismaBranchAdapter implements BranchRepository {
  async getBranchesByTenant(tenantId: string): Promise<Branch[]> {
    const branches = await prisma.branch.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return branches.map((b) => ({
      ...b,
      phone: b.phone ?? undefined,
      email: b.email ?? undefined,
      createdBy: b.createdBy ?? undefined,
      updatedBy: b.updatedBy ?? undefined,
      metadata: (b.metadata as Record<string, any>) ?? undefined,
    })) as Branch[];
  }

  async getBranchById(tenantId: string, branchId: string): Promise<Branch | null> {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });

    if (!branch) return null;

    return {
      ...branch,
      phone: branch.phone ?? undefined,
      email: branch.email ?? undefined,
      createdBy: branch.createdBy ?? undefined,
      updatedBy: branch.updatedBy ?? undefined,
      metadata: (branch.metadata as Record<string, any>) ?? undefined,
    } as Branch;
  }
}

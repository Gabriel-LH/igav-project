import { BranchRepository } from "@/src/domain/tenant/repositories/BranchRepository";
import { Branch } from "@/src/types/branch/type.branch";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaBranchRepository implements BranchRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async getBranches(): Promise<Branch[]> {
    const branches = await this.prisma.branch.findMany({
      where: { status: "active" },
    });
    return branches as unknown as Branch[];
  }

  async getBranchById(id: string): Promise<Branch | undefined> {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });
    return (branch as unknown as Branch) || undefined;
  }
}

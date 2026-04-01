import { BranchRepository } from "@/src/domain/tenant/repositories/BranchRepository";
import { Branch } from "@/src/types/branch/type.branch";
import prisma from "@/src/lib/prisma";

export class PrismaBranchAdapter implements BranchRepository {
  private mapBranch(b: any): Branch {
    return {
      ...b,
      phone: b.phone ?? undefined,
      email: b.email ?? undefined,
      createdBy: b.createdBy ?? undefined,
      updatedBy: b.updatedBy ?? undefined,
      metadata: (b.metadata as Record<string, any>) ?? undefined,
      config: b.branchConfigs?.[0] ? {
        ...b.branchConfigs[0],
        openHours: b.branchConfigs[0].openHours as any,
      } : undefined,
    } as Branch;
  }

  async getBranchesByTenant(tenantId: string): Promise<Branch[]> {
    const branches = await prisma.branch.findMany({
      where: { tenantId },
      include: { branchConfigs: true },
      orderBy: { createdAt: "desc" },
    });

    return branches.map((b: any) => this.mapBranch(b));
  }

  async getBranchById(tenantId: string, branchId: string): Promise<Branch | null> {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, tenantId },
      include: { branchConfigs: true },
    });

    if (!branch) return null;
    return this.mapBranch(branch);
  }

  async createBranch(tenantId: string, data: Partial<Branch>): Promise<Branch> {
    const branch = await prisma.$transaction(async (tx) => {
      // Si es primaria, quitar primaria a las demás
      if (data.isPrimary) {
        await tx.branch.updateMany({
          where: { tenantId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const newBranch = await tx.branch.create({
        data: {
          tenantId,
          code: data.code!,
          name: data.name!,
          city: data.city!,
          address: data.address!,
          phone: data.phone || null,
          email: data.email || null,
          timezone: data.timezone ?? "America/Lima",
          isPrimary: data.isPrimary ?? false,
          status: data.status ?? "active",
          createdBy: data.createdBy ?? "system",
          updatedBy: data.createdBy ?? "system",
          metadata: (data.metadata as any) ?? {},
        },
      });

      return newBranch;
    });

    return this.mapBranch(branch);
  }

  async updateBranch(tenantId: string, id: string, data: Partial<Branch>): Promise<Branch> {
    const branch = await prisma.$transaction(async (tx) => {
      // Si se está marcando como primaria, quitar primaria a las demás
      if (data.isPrimary) {
        await tx.branch.updateMany({
          where: { tenantId, isPrimary: true, id: { not: id } },
          data: { isPrimary: false },
        });
      }

      const updated = await tx.branch.update({
        where: { id, tenantId },
        data: {
          code: data.code,
          name: data.name,
          city: data.city,
          address: data.address,
          phone: data.phone === undefined ? undefined : (data.phone || null),
          email: data.email === undefined ? undefined : (data.email || null),
          timezone: data.timezone,
          isPrimary: data.isPrimary,
          status: data.status,
          updatedBy: data.updatedBy ?? "system",
          metadata: (data.metadata as any),
        },
      });

      return updated;
    });

    return this.mapBranch(branch);
  }
}

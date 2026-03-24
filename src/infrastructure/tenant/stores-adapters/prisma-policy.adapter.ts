import { PolicyRepository } from "../../../domain/tenant/repositories/PolicyRepository";
import { TenantPolicy } from "../../../types/tenant/type.tenantPolicy";
import prisma from "@/src/lib/prisma";

export class PrismaPolicyAdapter implements PolicyRepository {
  private prisma = prisma;

  async upsertPolicy(policy: TenantPolicy): Promise<void> {
    // 1. Desactivar políticas anteriores para este tenant
    await this.prisma.tenantPolicy.updateMany({
      where: { tenantId: policy.tenantId, isActive: true },
      data: { isActive: false },
    });

    // 2. Crear nueva política
    const newPolicy = await this.prisma.tenantPolicy.create({
      data: {
        id: policy.id,
        tenantId: policy.tenantId,
        version: policy.version,
        isActive: true,
        updatedBy: policy.updatedBy,
        changeReason: policy.changeReason,
        sales: policy.sales as any,
        rentals: policy.rentals as any,
        reservations: policy.reservations as any,
        inventory: policy.inventory as any,
        financial: policy.financial as any,
        security: policy.security as any,
      },
    });

    // 3. Crear entrada en el historial (opcional pero recomendado en el esquema)
    await this.prisma.tenantPolicyHistory.create({
      data: {
        policyId: newPolicy.id,
        version: policy.version,
        sales: policy.sales as any,
        rentals: policy.rentals as any,
        reservations: policy.reservations as any,
        inventory: policy.inventory as any,
        financial: policy.financial as any,
        security: policy.security as any,
        changedBy: policy.updatedBy,
        changeReason: policy.changeReason,
      },
    });
  }

  async getActivePolicy(tenantId: string): Promise<TenantPolicy | null> {
    const policy = await this.prisma.tenantPolicy.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { version: "desc" },
    });

    if (!policy) return null;

    return {
      ...policy,
      sales: policy.sales as any,
      rentals: policy.rentals as any,
      reservations: policy.reservations as any,
      inventory: policy.inventory as any,
      financial: policy.financial as any,
      security: policy.security as any,
    } as TenantPolicy;
  }

  async getPolicyByVersion(
    tenantId: string,
    version: number,
  ): Promise<TenantPolicy | null> {
    const policy = await this.prisma.tenantPolicy.findUnique({
      where: { tenantId_version: { tenantId, version } },
    });

    if (!policy) return null;

    return {
      ...policy,
      sales: policy.sales as any,
      rentals: policy.rentals as any,
      reservations: policy.reservations as any,
      inventory: policy.inventory as any,
      financial: policy.financial as any,
      security: policy.security as any,
    } as TenantPolicy;
  }

  async getHistory(tenantId: string): Promise<TenantPolicy[]> {
    const policies = await this.prisma.tenantPolicy.findMany({
      where: { tenantId },
      orderBy: { version: "desc" },
    });

    return policies.map(
      (p) =>
        ({
          ...p,
          sales: p.sales as any,
          rentals: p.rentals as any,
          reservations: p.reservations as any,
          inventory: p.inventory as any,
          financial: p.financial as any,
          security: p.security as any,
        }) as TenantPolicy,
    );
  }
}

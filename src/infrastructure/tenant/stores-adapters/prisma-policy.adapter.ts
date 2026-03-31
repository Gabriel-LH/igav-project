import { PolicyRepository } from "../../../domain/tenant/repositories/PolicyRepository";
import { TenantPolicy } from "../../../types/tenant/type.tenantPolicy";
import { DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";
import prisma from "@/src/lib/prisma";

export class PrismaPolicyAdapter implements PolicyRepository {
  private prisma = prisma;

  private normalizePolicy(policy: any): TenantPolicy {
    return {
      ...DEFAULT_TENANT_POLICY_SECTIONS,
      ...policy,
      sales: { ...DEFAULT_TENANT_POLICY_SECTIONS.sales, ...(policy.sales as any || {}) },
      rentals: { ...DEFAULT_TENANT_POLICY_SECTIONS.rentals, ...(policy.rentals as any || {}) },
      reservations: { ...DEFAULT_TENANT_POLICY_SECTIONS.reservations, ...(policy.reservations as any || {}) },
      inventory: { ...DEFAULT_TENANT_POLICY_SECTIONS.inventory, ...(policy.inventory as any || {}) },
      financial: { ...DEFAULT_TENANT_POLICY_SECTIONS.financial, ...(policy.financial as any || {}) },
      security: { ...DEFAULT_TENANT_POLICY_SECTIONS.security, ...(policy.security as any || {}) },
    } as TenantPolicy;
  }

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

    return this.normalizePolicy(policy);
  }

  async getOrCreateActivePolicy(
    tenantId: string,
    userId = "system",
  ): Promise<TenantPolicy> {
    const existing = await this.getActivePolicy(tenantId);
    if (existing) {
      return existing;
    }

    const seededPolicy: TenantPolicy = {
      id: crypto.randomUUID(),
      tenantId,
      version: 1,
      isActive: true,
      createdAt: new Date(),
      updatedBy: userId,
      changeReason: "Bootstrap inicial",
      ...DEFAULT_TENANT_POLICY_SECTIONS,
    } as TenantPolicy;

    await this.upsertPolicy(seededPolicy);
    return seededPolicy;
  }

  async getPolicyByVersion(
    tenantId: string,
    version: number,
  ): Promise<TenantPolicy | null> {
    const policy = await this.prisma.tenantPolicy.findUnique({
      where: { tenantId_version: { tenantId, version } },
    });

    if (!policy) return null;

    return this.normalizePolicy(policy);
  }

  async getHistory(tenantId: string): Promise<TenantPolicy[]> {
    const policies = await this.prisma.tenantPolicy.findMany({
      where: { tenantId },
      orderBy: { version: "desc" },
    });

    return policies.map((p) => this.normalizePolicy(p));
  }
}

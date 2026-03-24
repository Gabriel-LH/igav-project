import { TenantPolicy } from "../../../../types/tenant/type.tenantPolicy";
import { PolicyRepository } from "../../../../domain/tenant/repositories/PolicyRepository";

export class UpsertTenantPolicyUseCase {
  constructor(private policyRepository: PolicyRepository) {}

  async execute(params: {
    tenantId: string;
    userId: string;
    updates: Partial<TenantPolicy>;
    changeReason?: string;
  }): Promise<void> {
    const { tenantId, userId, updates, changeReason } = params;

    // 1. Obtener la política activa actual para determinar la nueva versión
    const currentPolicy = await this.policyRepository.getActivePolicy(tenantId);
    const newVersion = currentPolicy ? currentPolicy.version + 1 : 1;

    // 2. Fusionar con la política actual o usar valores por defecto
    const basePolicy: Partial<TenantPolicy> = currentPolicy || {};
    
    const newPolicy: TenantPolicy = {
      id: crypto.randomUUID(),
      tenantId,
      version: newVersion,
      isActive: true,
      createdAt: new Date(),
      updatedBy: userId,
      changeReason: changeReason || "Actualización manual",
      sales: { ...basePolicy.sales, ...updates.sales } as any,
      rentals: { ...basePolicy.rentals, ...updates.rentals } as any,
      reservations: { ...basePolicy.reservations, ...updates.reservations } as any,
      inventory: { ...basePolicy.inventory, ...updates.inventory } as any,
      financial: { ...basePolicy.financial, ...updates.financial } as any,
      security: { ...basePolicy.security, ...updates.security } as any,
    };

    // 3. Persistir
    await this.policyRepository.upsertPolicy(newPolicy);
  }
}

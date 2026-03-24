import { TenantPolicy } from "../../../../types/tenant/type.tenantPolicy";
import { PolicyRepository } from "../../../../domain/tenant/repositories/PolicyRepository";

export class GetTenantPolicyUseCase {
  constructor(private policyRepository: PolicyRepository) {}

  async execute(tenantId: string): Promise<TenantPolicy | null> {
    return await this.policyRepository.getActivePolicy(tenantId);
  }
}
